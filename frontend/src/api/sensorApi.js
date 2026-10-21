import {
  apiRequest,
} from "./http";

export function getLatestSensor() {
  return apiRequest(
    "/sensors/latest"
  );
}

export function getSensors() {
  return apiRequest(
    "/sensors"
  );
}