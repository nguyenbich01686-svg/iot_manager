import {
  apiRequest,
} from "./http";

export function getActions() {
  return apiRequest(
    "/actions"
  );
}