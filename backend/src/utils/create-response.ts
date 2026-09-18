import type { ApiErrorPayload } from "../types/api-error-payload.js";

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T | null;
  error: ApiErrorPayload | null;
}

export function createResponse<T>(
  success: boolean,
  message: string,
  data: T | null = null,
  error: ApiErrorPayload | null = null,
): ApiResponse<T> {
  return { success, message, data, error };
}

export function ok<T>(message: string, data: T | null = null): ApiResponse<T> {
  return createResponse(true, message, data, null);
}

export function fail(message: string, error: ApiErrorPayload): ApiResponse<null> {
  return createResponse(false, message, null, error);
}
