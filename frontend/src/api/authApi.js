import {
  apiRequest,
} from "./http";

export function loginApi(
  studentId,
  password
) {
  return apiRequest(
    "/auth/login",
    {
      method: "POST",

      body:
        JSON.stringify({
          studentId,
          password,
        }),
    }
  );
}