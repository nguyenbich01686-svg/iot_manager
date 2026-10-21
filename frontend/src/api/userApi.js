import {
  apiRequest,
} from "./http";

export function getMe() {
  return apiRequest(
    "/users/me"
  );
}