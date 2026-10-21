const SENSOR_KEY = "iot_sensor_history";
const DEVICE_KEY = "iot_devices";
const ACTION_KEY = "iot_actions";

const defaultDevices = [
  {
    id: 1,
    code: "LED1",
    name: "Air Conditioner",
    state: false,
  },
  {
    id: 2,
    code: "LED2",
    name: "Mist Spray",
    state: true,
  },
  {
    id: 3,
    code: "LED3",
    name: "Lighting",
    state: false,
  },
];

function readStorage(key, defaultValue) {
  try {
    const value = localStorage.getItem(key);

    return value
      ? JSON.parse(value)
      : defaultValue;
  } catch {
    return defaultValue;
  }
}

function writeStorage(key, value) {
  localStorage.setItem(
    key,
    JSON.stringify(value)
  );
}

function wait(ms = 100) {
  return new Promise(
    (resolve) => setTimeout(resolve, ms)
  );
}

function random(min, max, digits = 1) {
  return Number(
    (
      Math.random() *
        (max - min) +
      min
    ).toFixed(digits)
  );
}

// =================================
// INIT
// =================================

export function initializeMockData() {
  if (!localStorage.getItem(SENSOR_KEY)) {
    writeStorage(SENSOR_KEY, []);
  }

  if (!localStorage.getItem(DEVICE_KEY)) {
    writeStorage(
      DEVICE_KEY,
      defaultDevices
    );
  }

  if (!localStorage.getItem(ACTION_KEY)) {
    writeStorage(ACTION_KEY, []);
  }
}

// =================================
// SENSOR SIMULATOR
// =================================

export function generateSensorData() {
  const history =
    readStorage(SENSOR_KEY, []);

  const newData = {
    id: Date.now(),

    temperature:
      random(24, 31),

    humidity:
      random(55, 75),

    light:
      random(100, 1000, 0),

    recordedAt:
      new Date().toISOString(),
  };

  const updated = [
    ...history,
    newData,
  ].slice(-300);

  writeStorage(
    SENSOR_KEY,
    updated
  );

  return newData;
}

export function startSensorSimulator() {
  if (window.__sensorStarted) {
    return;
  }

  window.__sensorStarted = true;

  if (
    readStorage(
      SENSOR_KEY,
      []
    ).length === 0
  ) {
    generateSensorData();
  }

  setInterval(
    generateSensorData,
    2000
  );
}

// =================================
// GET /api/sensors/latest
// =================================

export async function getLatestSensor() {
  await wait();

  const history =
    readStorage(SENSOR_KEY, []);

  if (!history.length) {
    return {
      temperature: 25,
      humidity: 68,
      light: 150,
      recordedAt:
        new Date().toISOString(),
    };
  }

  return history[
    history.length - 1
  ];
}

// =================================
// GET /api/sensors
// =================================

export async function getSensorHistory() {
  await wait();

  return readStorage(
    SENSOR_KEY,
    []
  )
    .slice()
    .reverse();
}

// =================================
// GET /api/devices
// =================================

export async function getDevices() {
  await wait();

  return readStorage(
    DEVICE_KEY,
    defaultDevices
  );
}

// =================================
// PATCH /api/devices/:id
// =================================

export async function updateDevice(
  id,
  state
) {
  await wait();

  const devices =
    readStorage(
      DEVICE_KEY,
      defaultDevices
    );

  const index =
    devices.findIndex(
      (device) =>
        device.id === id
    );

  if (index === -1) {
    throw new Error(
      "Device not found"
    );
  }

  devices[index] = {
    ...devices[index],
    state,
  };

  writeStorage(
    DEVICE_KEY,
    devices
  );

  const actions =
    readStorage(
      ACTION_KEY,
      []
    );

  const newAction = {
    id: Date.now(),

    time:
      new Date().toISOString(),

    user:
      "ADMIN",

    device:
      devices[index].name,

    action:
      state ? "ON" : "OFF",

    status:
      "Success",
  };

  writeStorage(
    ACTION_KEY,
    [
      newAction,
      ...actions,
    ].slice(0, 300)
  );

  return devices[index];
}

// =================================
// GET /api/actions
// =================================

export async function getActions() {
  await wait();

  return readStorage(
    ACTION_KEY,
    []
  );
}

// =================================
// GET /api/profile
// =================================

export async function getProfile() {
  await wait();

  return {
    id: 1,

    fullName:
      "Nguyễn Thị Bích",

    studentId:
      "B23DCCN081",

    email:
      "BichNT.B23CN081@stu.ptit.edu.vn",

    role:
      "IoT Developer",
  };
}