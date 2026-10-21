const {
  readJson,
  writeJson,
} = require("./jsonDb");

function random(
  min,
  max,
  decimal = 1
) {
  return Number(
    (
      Math.random() * (max - min) +
      min
    ).toFixed(decimal)
  );
}

function generateSensorData() {
  const sensors =
    readJson("sensors.json");

  const newSensor = {
    id: Date.now(),

    temperature:
      random(24, 32),

    humidity:
      random(50, 80),

    light:
      random(100, 1000, 0),

    recordedAt:
      new Date().toISOString(),
  };

  sensors.push(newSensor);

  // chỉ giữ 2000 bản ghi gần nhất
  const updated =
    sensors.slice(-3000);

  writeJson(
    "sensors.json",
    updated
  );

  console.log(
    `[SENSOR] temp=${newSensor.temperature}°C | humi=${newSensor.humidity}% | light=${newSensor.light} lux`
  );

  return newSensor;
}

function startSensorSimulator() {
  console.log(
    "Sensor simulator started."
  );

  const sensors =
    readJson("sensors.json");

  if (sensors.length === 0) {
    generateSensorData();
  }

  setInterval(
    generateSensorData,
    2000
  );
}

module.exports = {
  startSensorSimulator,
};