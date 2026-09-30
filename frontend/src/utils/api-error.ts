import { isAxiosError } from "axios";
import { COMMON_MESSAGES } from "@/constants";
import type { ApiResponse } from "@/types";

// The backend's error handler only puts client-safe text in `message`, so it
// can be shown as-is.
export function getApiErrorMessage(error: unknown): string {
  if (!isAxiosError<ApiResponse<null>>(error)) {
    return COMMON_MESSAGES.UNKNOWN_ERROR;
  }
  if (!error.response) {
    return COMMON_MESSAGES.NETWORK_ERROR;
  }
  return error.response.data?.message || COMMON_MESSAGES.UNKNOWN_ERROR;
}
