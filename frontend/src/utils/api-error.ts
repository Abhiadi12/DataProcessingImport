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

// The HTTP status of a failed request, or null if it never got a response
// (network error) or wasn't an API error at all.
export function getApiErrorStatus(error: unknown): number | null {
  return isAxiosError(error) ? (error.response?.status ?? null) : null;
}
