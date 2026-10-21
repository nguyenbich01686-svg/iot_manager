import "../styles/dashboard.css";

import {
  useEffect,
  useState,
} from "react";

import {
  Droplets,
  Thermometer,
  Zap,
} from "lucide-react";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import SensorCard
  from "../components/SensorCard";

import DeviceToggle
  from "../components/DeviceToggle";

import {
  getLatestSensor,
  getSensors,
} from "../api/sensorApi";

import {
  getDevices,
  updateDevice,
} from "../api/deviceApi";


/* ==========================================
   DEVICE POLLING

   Khi device đang Loading,
   frontend kiểm tra trạng thái
   nhanh hơn bình thường.
========================================== */

const DEVICE_POLL_INTERVAL =
  180;


const DEVICE_POLL_TIMEOUT =
  3000;


/* ==========================================
   SLEEP
========================================== */

function sleep(
  milliseconds
) {

  return new Promise(
    (
      resolve
    ) => {

      setTimeout(
        resolve,
        milliseconds
      );
    }
  );
}


/* ==========================================
   NICE STEP FOR LIGHT AXIS

   Ví dụ:

   max 92
   -> 0 20 40 60 80 100

   max 117
   -> 0 25 50 75 100 125

   max 180
   -> 0 40 80 120 160 200
========================================== */

function getNiceStep(
  maxValue
) {

  const roughStep =
    maxValue / 5;


  const magnitude =
    Math.pow(
      10,
      Math.floor(
        Math.log10(
          roughStep
        )
      )
    );


  const normalized =
    roughStep /
    magnitude;


  let niceFactor;


  if (
    normalized <= 1
  ) {

    niceFactor =
      1;

  } else if (
    normalized <= 2
  ) {

    niceFactor =
      2;

  } else if (
    normalized <= 2.5
  ) {

    niceFactor =
      2.5;

  } else if (
    normalized <= 4
  ) {

    niceFactor =
      4;

  } else if (
    normalized <= 5
  ) {

    niceFactor =
      5;

  } else {

    niceFactor =
      10;
  }


  return (
    niceFactor *
    magnitude
  );
}


function Dashboard() {

  const [
    sensor,
    setSensor,
  ] =
    useState({
      temperature:
        0,

      humidity:
        0,

      light:
        0,
    });


  const [
    history,
    setHistory,
  ] =
    useState([]);


  const [
    devices,
    setDevices,
  ] =
    useState([]);


  /* ==========================================
     LOAD SENSOR DATA
  ========================================== */

  async function loadSensorData() {

    try {

      const [
        latest,
        historyData,
      ] =
        await Promise.all([
          getLatestSensor(),
          getSensors(),
        ]);


      setSensor(
        latest
      );


      setHistory(
        historyData
          .slice(
            0,
            20
          )
          .reverse()
      );

    } catch (error) {

      console.error(
        "Load sensor data error:",
        error
      );
    }
  }


  /* ==========================================
     LOAD DEVICE DATA
  ========================================== */

  async function loadDeviceData() {

    try {

      const deviceData =
        await getDevices();


      setDevices(
        Array.isArray(
          deviceData
        )
          ? deviceData
          : []
      );

    } catch (error) {

      console.error(
        "Load device data error:",
        error
      );
    }
  }


  /* ==========================================
     INITIAL LOAD
  ========================================== */

  useEffect(
    () => {

      let mounted =
        true;


      async function loadInitialData() {

        try {

          const [
            latest,
            historyData,
            deviceData,
          ] =
            await Promise.all([
              getLatestSensor(),
              getSensors(),
              getDevices(),
            ]);


          if (
            !mounted
          ) {

            return;
          }


          setSensor(
            latest
          );


          setHistory(
            historyData
              .slice(
                0,
                20
              )
              .reverse()
          );


          setDevices(
            Array.isArray(
              deviceData
            )
              ? deviceData
              : []
          );

        } catch (error) {

          console.error(
            "Load dashboard error:",
            error
          );
        }
      }


      loadInitialData();


      /*
        Sensor vẫn refresh mỗi 2 giây.

        KHÔNG refresh device bằng timer này,
        vì nó có thể ghi đè trạng thái
        Loading đang được xử lý.
      */

      const sensorTimer =
        setInterval(
          () => {

            if (
              mounted
            ) {

              loadSensorData();
            }
          },
          2000
        );


      return () => {

        mounted =
          false;


        clearInterval(
          sensorTimer
        );
      };
    },

    []
  );


  /* ==========================================
     POLL DEVICE UNTIL FINISHED
  ========================================== */

  async function pollDeviceUntilFinished(
    deviceId
  ) {

    const startedAt =
      Date.now();


    while (
      Date.now() -
        startedAt <
      DEVICE_POLL_TIMEOUT
    ) {

      await sleep(
        DEVICE_POLL_INTERVAL
      );


      const latestDevices =
        await getDevices();


      if (
        !Array.isArray(
          latestDevices
        )
      ) {

        continue;
      }


      setDevices(
        latestDevices
      );


      const currentDevice =
        latestDevices.find(
          (
            item
          ) =>
            Number(
              item.id
            ) ===
            Number(
              deviceId
            )
        );


      if (
        currentDevice &&
        !currentDevice.loading
      ) {

        return currentDevice;
      }
    }


    try {

      const finalDevices =
        await getDevices();


      if (
        Array.isArray(
          finalDevices
        )
      ) {

        setDevices(
          finalDevices
        );


        return finalDevices.find(
          (
            item
          ) =>
            Number(
              item.id
            ) ===
            Number(
              deviceId
            )
        );
      }

    } catch (error) {

      console.error(
        "Final device refresh error:",
        error
      );
    }


    return null;
  }


  /* ==========================================
     DEVICE CONTROL
  ========================================== */

  async function handleToggle(
    device
  ) {

    if (
      device.loading
    ) {

      return;
    }


    const requestedState =
      !device.state;


    /*
      Hiển thị loading ngay lập tức.
    */

    setDevices(
      (
        currentDevices
      ) =>

        currentDevices.map(
          (
            item
          ) => {

            if (
              Number(
                item.id
              ) !==
              Number(
                device.id
              )
            ) {

              return item;
            }


            return {
              ...item,

              loading:
                true,

              requestedState:
                requestedState,
            };
          }
        )
    );


    try {

      const response =
        await updateDevice(
          device.id,
          requestedState
        );


      if (
        response &&
        response.device
      ) {

        setDevices(
          (
            currentDevices
          ) =>

            currentDevices.map(
              (
                item
              ) => {

                if (
                  Number(
                    item.id
                  ) !==
                  Number(
                    device.id
                  )
                ) {

                  return item;
                }


                return {
                  ...item,
                  ...response.device,

                  loading:
                    true,

                  requestedState:
                    requestedState,
                };
              }
            )
        );
      }


      await pollDeviceUntilFinished(
        device.id
      );

    } catch (error) {

      console.error(
        "Update device error:",
        error
      );


      try {

        await loadDeviceData();

      } catch {

        setDevices(
          (
            currentDevices
          ) =>

            currentDevices.map(
              (
                item
              ) => {

                if (
                  Number(
                    item.id
                  ) !==
                  Number(
                    device.id
                  )
                ) {

                  return item;
                }


                return {
                  ...item,

                  loading:
                    false,
                };
              }
            )
        );
      }
    }
  }


  /* ==========================================
     FORMAT HH:mm:ss
  ========================================== */

  function formatTime(
    value
  ) {

    const date =
      new Date(
        value
      );


    const hours =
      String(
        date.getHours()
      ).padStart(
        2,
        "0"
      );


    const minutes =
      String(
        date.getMinutes()
      ).padStart(
        2,
        "0"
      );


    const seconds =
      String(
        date.getSeconds()
      ).padStart(
        2,
        "0"
      );


    return (
      `${hours}:${minutes}:${seconds}`
    );
  }


  /* ==========================================
     FORMAT dd/MM/yyyy HH:mm:ss
  ========================================== */

  function formatDateTime(
    value
  ) {

    const date =
      new Date(
        value
      );


    const day =
      String(
        date.getDate()
      ).padStart(
        2,
        "0"
      );


    const month =
      String(
        date.getMonth() +
        1
      ).padStart(
        2,
        "0"
      );


    const year =
      date.getFullYear();


    const hours =
      String(
        date.getHours()
      ).padStart(
        2,
        "0"
      );


    const minutes =
      String(
        date.getMinutes()
      ).padStart(
        2,
        "0"
      );


    const seconds =
      String(
        date.getSeconds()
      ).padStart(
        2,
        "0"
      );


    return (
      `${day}/${month}/${year} ` +
      `${hours}:${minutes}:${seconds}`
    );
  }


  /* ==========================================
     CHART DATA
  ========================================== */

  const chartData =
    history.map(
      (
        item
      ) => ({

        ...item,

        timestamp:
          new Date(
            item.recordedAt
          ).getTime(),
      })
    );


  /* ==========================================
     LIGHT AXIS AUTO SCALE
  ========================================== */

  const lightValues =
    chartData
      .map(
        (
          item
        ) =>
          Number(
            item.light
          )
      )
      .filter(
        (
          value
        ) =>
          Number.isFinite(
            value
          )
      );


  const maxLightValue =
    lightValues.length > 0
      ? Math.max(
          ...lightValues
        )
      : 0;


  /*
    Tối thiểu cho trục light là 100.

    Nếu dữ liệu vượt 100,
    trục sẽ tự tăng lên mốc phù hợp.
  */

  const lightScaleBase =
    Math.max(
      100,
      maxLightValue
    );


  const lightStep =
    getNiceStep(
      lightScaleBase
    );


  const lightAxisMax =
    Math.ceil(
      lightScaleBase /
      lightStep
    ) *
    lightStep;


  const lightTicks =
    Array.from(
      {
        length:
          Math.round(
            lightAxisMax /
            lightStep
          ) + 1,
      },

      (
        _,
        index
      ) =>
        index *
        lightStep
    );


  return (

    <div
      className=
        "page-shell dashboard-page"
    >

      <h1
        className=
          "page-title"
      >
        Dashboard
      </h1>


      {/* ======================================
          SENSOR CARDS
      ====================================== */}

      <div
        className=
          "sensor-grid"
      >

        <SensorCard
          title=
            "Temperature"

          value={
            sensor.temperature
          }

          unit=
            "°C"

          color=
            "orange"

          icon={
            <Thermometer
              size={21}
            />
          }
        />


        <SensorCard
          title=
            "Humidity"

          value={
            sensor.humidity
          }

          unit=
            "%"

          color=
            "blue"

          icon={
            <Droplets
              size={21}
            />
          }
        />


        <SensorCard
          title=
            "Light Intensity"

          value={
            sensor.light
          }

          unit=
            " lux"

          color=
            "yellow"

          icon={
            <Zap
              size={21}
            />
          }
        />

      </div>


      {/* ======================================
          DEVICE CONTROL
      ====================================== */}

      <div
        className=
          "device-grid"
      >

        {
          devices.map(
            (
              device
            ) => (

              <DeviceToggle
                key={
                  device.id
                }

                device={
                  device
                }

                onToggle={
                  handleToggle
                }
              />

            )
          )
        }

      </div>


      {/* ======================================
          SENSOR HISTORY
      ====================================== */}

      <section
        className=
          "chart-card dashboard-chart"
      >

        <h2>
          Sensor History
        </h2>


        <div
          className=
            "chart-area"
        >

          <ResponsiveContainer
            width=
              "100%"

            height=
              "100%"
          >

            <LineChart
              data={
                chartData
              }

              margin={{
                top:
                  5,

                right:
                  10,

                left:
                  -10,

                bottom:
                  5,
              }}
            >

              <CartesianGrid
                vertical={
                  false
                }

                stroke=
                  "#EDF0F3"
              />


              {/* ==================================
                  X AXIS
              ================================== */}

              <XAxis
                dataKey=
                  "timestamp"

                type=
                  "number"

                domain={[
                  "dataMin",
                  "dataMax",
                ]}

                tickFormatter={
                  formatTime
                }

                interval={0}

                tick={{
                  fontSize:
                    10,

                  fill:
                    "#64748B",
                }}

                tickMargin={8}

                angle={-35}

                textAnchor=
                  "end"

                height={58}
              />


              {/* ==================================
                  LEFT AXIS

                  Temperature + Humidity
              ================================== */}

              <YAxis
                yAxisId=
                  "left"

                domain={[
                  0,
                  100,
                ]}

                ticks={[
                  0,
                  20,
                  40,
                  60,
                  80,
                  100,
                ]}

                tick={{
                  fontSize:
                    11,

                  fill:
                    "#64748B",
                }}
              />


              {/* ==================================
                  RIGHT AXIS

                  LIGHT - AUTO SCALE
              ================================== */}

              <YAxis
                yAxisId=
                  "right"

                orientation=
                  "right"

                domain={[
                  0,
                  lightAxisMax,
                ]}

                ticks={
                  lightTicks
                }

                allowDataOverflow={
                  false
                }

                tick={{
                  fontSize:
                    11,

                  fill:
                    "#64748B",
                }}
              />


              {/* ==================================
                  TOOLTIP
              ================================== */}

              <Tooltip
                labelFormatter={
                  (
                    value
                  ) =>
                    formatDateTime(
                      Number(
                        value
                      )
                    )
                }

                formatter={
                  (
                    value,
                    name
                  ) => {

                    if (
                      name ===
                      "Light"
                    ) {

                      return [
                        `${value} lux`,
                        name,
                      ];
                    }


                    if (
                      name ===
                      "Humidity"
                    ) {

                      return [
                        `${value}%`,
                        name,
                      ];
                    }


                    if (
                      name ===
                      "Temperature"
                    ) {

                      return [
                        `${value}°C`,
                        name,
                      ];
                    }


                    return [
                      value,
                      name,
                    ];
                  }
                }

                cursor={{
                  stroke:
                    "#CBD5E1",

                  strokeWidth:
                    1,
                }}

                contentStyle={{
                  border:
                    "1px solid #E2E8F0",

                  borderRadius:
                    "8px",

                  boxShadow:
                    "0 4px 14px rgba(0,0,0,0.08)",

                  backgroundColor:
                    "#FFFFFF",
                }}
              />


              <Legend />


              {/* ==================================
                  HUMIDITY
              ================================== */}

              <Line
                yAxisId=
                  "left"

                type=
                  "monotone"

                dataKey=
                  "humidity"

                name=
                  "Humidity"

                stroke=
                  "#3B82F6"

                strokeWidth={2}

                dot={
                  false
                }

                activeDot={{
                  r:
                    4,

                  strokeWidth:
                    2,
                }}

                isAnimationActive={
                  false
                }
              />


              {/* ==================================
                  LIGHT
              ================================== */}

              <Line
                yAxisId=
                  "right"

                type=
                  "monotone"

                dataKey=
                  "light"

                name=
                  "Light"

                stroke=
                  "#EAB308"

                strokeWidth={2}

                dot={
                  false
                }

                activeDot={{
                  r:
                    4,

                  strokeWidth:
                    2,
                }}

                isAnimationActive={
                  false
                }
              />


              {/* ==================================
                  TEMPERATURE
              ================================== */}

              <Line
                yAxisId=
                  "left"

                type=
                  "monotone"

                dataKey=
                  "temperature"

                name=
                  "Temperature"

                stroke=
                  "#F97316"

                strokeWidth={2}

                dot={
                  false
                }

                activeDot={{
                  r:
                    4,

                  strokeWidth:
                    2,
                }}

                isAnimationActive={
                  false
                }
              />

            </LineChart>

          </ResponsiveContainer>

        </div>

      </section>

    </div>
  );
}


export default Dashboard;