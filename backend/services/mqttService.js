const mqtt =
  require("mqtt");


const {
  sql,
  withDb,
} =
  require("../config/db");


/* ==========================================
   MQTT CLIENT
========================================== */

let mqttClient =
  null;


/* ==========================================
   PENDING DEVICE ACTIONS
========================================== */

const pendingActions =
  new Map();


/* ==========================================
   MQTT TOPICS
========================================== */

const SENSOR_TOPIC =
  process.env.MQTT_TOPIC_SENSOR ||
  "Sensor_data";


const CONTROL_TOPIC =
  process.env.MQTT_TOPIC_CONTROL ||
  "Device_control";


const RESPONSE_TOPIC =
  process.env.MQTT_TOPIC_RESPONSE ||
  "Device_response";


const STATE_TOPIC =
  process.env.MQTT_TOPIC_STATE ||
  "Device_state";


/* ==========================================
   DEVICE RESPONSE TIMEOUT
========================================== */

const DEVICE_RESPONSE_TIMEOUT =
  Number(
    process.env
      .DEVICE_RESPONSE_TIMEOUT_MS ||
    1500
  );


/* ==========================================
   PARSE BOOLEAN
========================================== */

function parseBoolean(
  value
) {

  if (
    typeof value ===
    "boolean"
  ) {

    return value;
  }


  const normalized =
    String(
      value
    )
      .trim()
      .toLowerCase();


  if (
    [
      "1",
      "true",
      "on",
    ].includes(
      normalized
    )
  ) {

    return true;
  }


  if (
    [
      "0",
      "false",
      "off",
    ].includes(
      normalized
    )
  ) {

    return false;
  }


  return null;
}


/* ==========================================
   PARSE KEY VALUE SENSOR TEXT

   temp:32.4,humi:64.0,light:19.2
========================================== */

function parseKeyValuePayload(
  raw
) {

  const result = {};


  for (
    const part
    of raw.split(",")
  ) {

    const index =
      part.indexOf(":");


    if (
      index === -1
    ) {

      continue;
    }


    const key =
      part
        .slice(
          0,
          index
        )
        .trim();


    const value =
      part
        .slice(
          index + 1
        )
        .trim();


    if (
      key
    ) {

      result[key] =
        value;
    }
  }


  return result;
}


/* ==========================================
   PARSE SENSOR PAYLOAD
========================================== */

function parseSensorPayload(
  raw
) {

  let source;


  try {

    source =
      JSON.parse(
        raw
      );

  } catch {

    source =
      parseKeyValuePayload(
        raw
      );
  }


  const data = {

    temperature:
      Number(
        source.temperature ??
        source.temp
      ),

    humidity:
      Number(
        source.humidity ??
        source.humi
      ),

    light:
      Number(
        source.light
      ),
  };


  if (
    !Number.isFinite(
      data.temperature
    ) ||

    !Number.isFinite(
      data.humidity
    ) ||

    !Number.isFinite(
      data.light
    )
  ) {

    throw new Error(
      `Invalid sensor payload: ${raw}`
    );
  }


  return data;
}


/* ==========================================
   SAVE SENSOR DATA
========================================== */

async function saveSensorData(
  data
) {

  const recordedAt =
    new Date();


  await withDb(

    (pool) =>

      pool
        .request()

        .input(
          "temperature",
          sql.Decimal(
            10,
            2
          ),
          data.temperature
        )

        .input(
          "humidity",
          sql.Decimal(
            10,
            2
          ),
          data.humidity
        )

        .input(
          "light",
          sql.Decimal(
            10,
            2
          ),
          data.light
        )

        .input(
          "recordedAt",
          sql.DateTime2,
          recordedAt
        )

        .query(`
          INSERT INTO data_sensor (
            sensor_id,
            value,
            unit,
            create_at
          )

          SELECT

            s.id,
            v.sensor_value,
            v.unit,
            @recordedAt

          FROM (
            VALUES

              (
                N'Temperature',
                @temperature,
                N'°C'
              ),

              (
                N'Humidity',
                @humidity,
                N'%'
              ),

              (
                N'Light',
                @light,
                N'lux'
              )

          ) AS v (
            sensor_name,
            sensor_value,
            unit
          )

          INNER JOIN sensors s

            ON s.name =
               v.sensor_name;
        `),

    {
      retry:
        false,
    }
  );
}


/* ==========================================
   HANDLE SENSOR
========================================== */

async function handleSensorMessage(
  message
) {

  const raw =
    message
      .toString()
      .trim();


  try {

    const data =
      parseSensorPayload(
        raw
      );


    console.log(
      `[MQTT SENSOR RAW] ${raw}`
    );


    console.log(
      `[MQTT SENSOR] temp=${data.temperature}°C | humi=${data.humidity}% | light=${data.light} lux`
    );


    await saveSensorData(
      data
    );


    console.log(
      `[SENSOR SAVED] temp=${data.temperature}°C | humi=${data.humidity}% | light=${data.light} lux`
    );

  } catch (error) {

    console.error(
      "Sensor MQTT error:",
      error.message
    );
  }
}


/* ==========================================
   ACTION -> ERROR
========================================== */

async function markActionError(
  actionId
) {

  await withDb(
    (pool) =>

      pool
        .request()

        .input(
          "actionId",
          sql.BigInt,
          actionId
        )

        .query(`
          UPDATE actions

          SET status =
            'Error'

          WHERE
            id =
              @actionId

            AND status =
              'Loading';
        `)
  );
}


/* ==========================================
   CREATE DEVICE STATE PAYLOAD FROM DB

   DB là SOURCE OF TRUTH.
========================================== */

async function getDeviceStatePayload() {

  const result =
    await withDb(
      (pool) =>

        pool
          .request()
          .query(`
            SELECT
              code,
              current_status

            FROM devices

            ORDER BY
              id ASC;
          `)
    );


  const devices =
    result.recordset.map(
      (
        item
      ) => ({

        device:
          item.code,

        state:
          Boolean(
            item.current_status
          ),
      })
    );


  return JSON.stringify({

    type:
      "state",

    devices:
      devices,
  });
}


/* ==========================================
   PUBLISH RETAINED DEVICE STATE

   Mosquitto sẽ giữ message cuối cùng.

   ESP vừa reconnect chỉ cần subscribe
   là nhận ngay, không cần query DB lại.
========================================== */

async function publishDeviceState() {

  try {

    if (
      !mqttClient ||
      !mqttClient.connected
    ) {

      return;
    }


    const payload =
      await getDeviceStatePayload();


    mqttClient.publish(
      STATE_TOPIC,

      payload,

      {
        qos:
          1,

        retain:
          true,
      },

      (
        error
      ) => {

        if (
          error
        ) {

          console.error(
            "Publish retained device state error:",
            error.message
          );


          return;
        }


        console.log(
          `[DEVICE STATE RETAINED] ${payload}`
        );
      }
    );

  } catch (error) {

    console.error(
      "Publish device state error:",
      error.message
    );
  }
}


/* ==========================================
   PARSE DEVICE RESPONSE

   Arduino trả:

   {
     "device":"LED1",
     "state":true,
     "actionId":15,
     "status":"Success"
   }
========================================== */

function parseDeviceResponse(
  raw
) {

  let source;


  try {

    source =
      JSON.parse(
        raw
      );

  } catch {

    return null;
  }


  return {

    device:
      String(
        source.device ||
        ""
      )
        .trim()
        .toUpperCase(),

    state:
      parseBoolean(
        source.state
      ),

    actionId:
      Number(
        source.actionId
      ),

    status:
      String(
        source.status ||
        ""
      )
        .trim(),
  };
}


/* ==========================================
   HANDLE DEVICE RESPONSE
========================================== */

async function handleDeviceResponse(
  message
) {

  const raw =
    message
      .toString()
      .trim();


  console.log(
    `[DEVICE RESPONSE RAW] ${raw}`
  );


  try {

    const response =
      parseDeviceResponse(
        raw
      );


    /* ======================================
       INVALID RESPONSE
    ====================================== */

    if (
      !response ||

      !Number.isInteger(
        response.actionId
      ) ||

      !response.device ||

      response.state ===
        null
    ) {

      console.log(
        "Invalid device response."
      );


      return;
    }


    /* ======================================
       FIND PENDING ACTION
    ====================================== */

    const pending =
      pendingActions.get(
        response.actionId
      );


    /*
      Không có pending:

      - action đã timeout
      - actionId sai
      - response tới quá muộn
    */

    if (
      !pending
    ) {

      console.log(
        `[DEVICE RESPONSE IGNORED] actionId=${response.actionId}`
      );


      return;
    }


    /* ======================================
       STOP TIMEOUT
    ====================================== */

    clearTimeout(
      pending.timeout
    );


    pendingActions.delete(
      response.actionId
    );


    /* ======================================
       CHECK DEVICE CODE
    ====================================== */

    if (
      response.device !==
      pending.deviceCode
    ) {

      await markActionError(
        response.actionId
      );


      console.log(
        `[DEVICE ERROR] actionId=${response.actionId} - wrong device`
      );


      return;
    }


    /* ======================================
       CHECK HARDWARE STATUS
    ====================================== */

    if (
      response.status
        .toLowerCase() !==
      "success"
    ) {

      await markActionError(
        response.actionId
      );


      console.log(
        `[DEVICE ERROR] actionId=${response.actionId} - hardware error`
      );


      return;
    }


    /* ======================================
       CHECK ACTUAL STATE
    ====================================== */

    if (
      response.state !==
      pending.requestedState
    ) {

      await markActionError(
        response.actionId
      );


      console.log(
        `[DEVICE ERROR] actionId=${response.actionId} - state mismatch`
      );


      return;
    }


    /* ======================================
       SUCCESS

       1. update devices
       2. action -> Success
    ====================================== */

    await withDb(
      async (
        pool
      ) => {

        const transaction =
          new sql.Transaction(
            pool
          );


        await transaction.begin();


        try {

          /* ==============================
             UPDATE DEVICE
          ============================== */

          await new sql.Request(
            transaction
          )

            .input(
              "deviceId",
              sql.Int,
              pending.deviceId
            )

            .input(
              "state",
              sql.Bit,
              response.state
            )

            .query(`
              UPDATE devices

              SET current_status =
                @state

              WHERE id =
                @deviceId;
            `);


          /* ==============================
             UPDATE ACTION
          ============================== */

          await new sql.Request(
            transaction
          )

            .input(
              "actionId",
              sql.BigInt,
              response.actionId
            )

            .query(`
              UPDATE actions

              SET status =
                'Success'

              WHERE
                id =
                  @actionId

                AND status =
                  'Loading';
            `);


          await transaction.commit();

        } catch (error) {

          try {

            await transaction.rollback();

          } catch {

            // Ignore rollback error.
          }


          throw error;
        }
      }
    );


    console.log(
      `[DEVICE SUCCESS] ${response.device} = ${
        response.state
          ? "ON"
          : "OFF"
      }`
    );


    /*
      DB đã Success rồi.

      Update retained state SAU ĐÓ.

      Không await ở đây để luồng
      Success/UI không phải chờ thêm
      query retained state.
    */

    publishDeviceState();

  } catch (error) {

    console.error(
      "Device response error:",
      error.message
    );
  }
}


/* ==========================================
   CHECK DEVICE PENDING
========================================== */

function isDevicePending(
  deviceId
) {

  const numericId =
    Number(
      deviceId
    );


  for (
    const pending
    of pendingActions.values()
  ) {

    if (
      pending.deviceId ===
      numericId
    ) {

      return true;
    }
  }


  return false;
}


/* ==========================================
   SEND DEVICE COMMAND

   Backend -> ESP

   {
     "device":"LED1",
     "state":true,
     "actionId":15
   }
========================================== */

function sendDeviceCommand({
  actionId,
  deviceId,
  deviceCode,
  state,
}) {

  return new Promise(
    (
      resolve,
      reject
    ) => {

      /* ==================================
         MQTT NOT CONNECTED
      ================================== */

      if (
        !mqttClient ||
        !mqttClient.connected
      ) {

        reject(
          new Error(
            "MQTT broker is not connected"
          )
        );


        return;
      }


      /* ==================================
         RESPONSE TIMEOUT
      ================================== */

      const timeout =
        setTimeout(
          async () => {

            const pending =
              pendingActions.get(
                actionId
              );


            if (
              !pending
            ) {

              return;
            }


            pendingActions.delete(
              actionId
            );


            try {

              await markActionError(
                actionId
              );


              console.log(
                `[DEVICE TIMEOUT] ${deviceCode} actionId=${actionId}`
              );

            } catch (error) {

              console.error(
                "Device timeout error:",
                error.message
              );
            }

          },

          DEVICE_RESPONSE_TIMEOUT
        );


      /* ==================================
         SAVE PENDING
      ================================== */

      pendingActions.set(
        actionId,
        {

          actionId:
            actionId,

          deviceId:
            deviceId,

          deviceCode:
            String(
              deviceCode
            )
              .trim()
              .toUpperCase(),

          requestedState:
            Boolean(
              state
            ),

          timeout:
            timeout,
        }
      );


      /* ==================================
         CONTROL PAYLOAD
      ================================== */

      const payload =
        JSON.stringify({

          device:
            String(
              deviceCode
            )
              .trim()
              .toUpperCase(),

          state:
            Boolean(
              state
            ),

          actionId:
            actionId,
        });


      /* ==================================
         PUBLISH CONTROL

         Không retain command ON/OFF.

         Nếu retain command thì ESP restart
         có thể thực hiện lại action cũ.

         Chỉ Device_state mới retain.
      ================================== */

      mqttClient.publish(
        CONTROL_TOPIC,

        payload,

        {
          qos:
            0,

          retain:
            false,
        },

        (
          error
        ) => {

          if (
            error
          ) {

            clearTimeout(
              timeout
            );


            pendingActions.delete(
              actionId
            );


            reject(
              error
            );


            return;
          }


          console.log(
            `[DEVICE CONTROL] ${payload}`
          );


          resolve();
        }
      );
    }
  );
}


/* ==========================================
   RESET OLD LOADING
========================================== */

async function resetLoadingActions() {

  await withDb(
    (pool) =>

      pool
        .request()
        .query(`
          UPDATE actions

          SET status =
            'Error'

          WHERE status =
            'Loading';
        `)
  );
}


/* ==========================================
   CONNECT MQTT
========================================== */

function connectMQTT() {

  const host =
    process.env.MQTT_HOST ||
    "127.0.0.1";


  const port =
    Number(
      process.env.MQTT_PORT ||
      1884
    );


  console.log(
    `Connecting MQTT: mqtt://${host}:${port}`
  );


  mqttClient =
    mqtt.connect({

      protocol:
        "mqtt",

      host:
        host,

      port:
        port,

      username:
        process.env
          .MQTT_USERNAME,

      password:
        process.env
          .MQTT_PASSWORD,

      protocolVersion:
        4,

      clean:
        true,

      keepalive:
        30,

      reconnectPeriod:
        1000,

      connectTimeout:
        10000,

      clientId:
        `iot_backend_${process.pid}_${Date.now().toString(16)}`,
    });


  /* ======================================
     MQTT CONNECTED
  ====================================== */

  mqttClient.on(
    "connect",

    () => {

      console.log(
        "MQTT connected."
      );


      /* ==================================
         SENSOR TOPIC
      ================================== */

      mqttClient.subscribe(
        SENSOR_TOPIC,

        {
          qos:
            0,
        },

        (
          error
        ) => {

          if (
            error
          ) {

            console.error(
              `Subscribe ${SENSOR_TOPIC} error:`,
              error.message
            );


            return;
          }


          console.log(
            `Subscribed: ${SENSOR_TOPIC}`
          );
        }
      );


      /* ==================================
         DEVICE RESPONSE
      ================================== */

      mqttClient.subscribe(
        RESPONSE_TOPIC,

        {
          qos:
            0,
        },

        (
          error
        ) => {

          if (
            error
          ) {

            console.error(
              `Subscribe ${RESPONSE_TOPIC} error:`,
              error.message
            );


            return;
          }


          console.log(
            `Subscribed: ${RESPONSE_TOPIC}`
          );
        }
      );


      /*
        Mỗi lần backend connect/reconnect
        broker:

        đọc DB một lần rồi cập nhật
        retained Device_state.

        Như vậy retained state luôn
        được đồng bộ lại từ DB.
      */

      publishDeviceState();
    }
  );


  /* ======================================
     MQTT MESSAGE
  ====================================== */

  mqttClient.on(
    "message",

    (
      topic,
      message
    ) => {

      /* ==================================
         SENSOR
      ================================== */

      if (
        topic ===
        SENSOR_TOPIC
      ) {

        handleSensorMessage(
          message
        );


        return;
      }


      /* ==================================
         DEVICE RESPONSE
      ================================== */

      if (
        topic ===
        RESPONSE_TOPIC
      ) {

        handleDeviceResponse(
          message
        );
      }
    }
  );


  /* ======================================
     RECONNECT
  ====================================== */

  mqttClient.on(
    "reconnect",

    () => {

      console.log(
        "MQTT reconnecting..."
      );
    }
  );


  /* ======================================
     OFFLINE
  ====================================== */

  mqttClient.on(
    "offline",

    () => {

      console.log(
        "MQTT offline."
      );
    }
  );


  /* ======================================
     CLOSED
  ====================================== */

  mqttClient.on(
    "close",

    () => {

      console.log(
        "MQTT connection closed."
      );
    }
  );


  /* ======================================
     ERROR
  ====================================== */

  mqttClient.on(
    "error",

    (
      error
    ) => {

      console.error(
        "MQTT error:",
        error.message
      );
    }
  );


  return mqttClient;
}


/* ==========================================
   MQTT STATUS
========================================== */

function isMqttConnected() {

  return Boolean(
    mqttClient &&
    mqttClient.connected
  );
}


/* ==========================================
   DISCONNECT
========================================== */

function disconnectMQTT() {

  if (
    mqttClient
  ) {

    mqttClient.end(
      true
    );


    mqttClient =
      null;
  }
}


/* ==========================================
   EXPORT
========================================== */

module.exports = {

  connectMQTT,

  disconnectMQTT,

  isMqttConnected,

  sendDeviceCommand,

  isDevicePending,

  resetLoadingActions,
};