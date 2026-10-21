import {
  apiRequest,
} from "./http";

export function getDevices() {
  return apiRequest(
    "/devices"
  );
}

export function updateDevice(
  id,
  state
) {
  return apiRequest(
    `/devices/${id}`,
    {
      method: "PATCH",

      body:
        JSON.stringify({
          state,
        }),
    }
  );
}