require("dotenv")
  .config({
    quiet:
      true,
  });


const mqtt =
  require("mqtt");


const client =
  mqtt.connect({

    protocol:
      "mqtt",

    host:
      process.env.MQTT_HOST ||
      "127.0.0.1",

    port:
      Number(
        process.env.MQTT_PORT ||
        1884
      ),

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
      0,

    connectTimeout:
      10000,
  });


/* ==========================================
   CONNECT
========================================== */

client.on(
  "connect",

  () => {

    console.log(
      "MQTT CONNECTED"
    );


    const topic =
      process.env
        .MQTT_TOPIC_SENSOR ||
      "Sensor_data";


    client.subscribe(
      topic,

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
            "Subscribe error:",
            error.message
          );


          process.exitCode =
            1;


          client.end(
            true
          );


          return;
        }


        console.log(
          `Subscribed: ${topic}`
        );
      }
    );
  }
);


/* ==========================================
   MESSAGE
========================================== */

client.on(
  "message",

  (
    topic,
    message
  ) => {

    console.log(
      topic,
      message.toString()
    );
  }
);


/* ==========================================
   ERROR
========================================== */

client.on(
  "error",

  (
    error
  ) => {

    console.error(
      "MQTT ERROR:",
      error.message
    );
  }
);