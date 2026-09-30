import type { InternalAxiosRequestConfig } from "axios";

export interface ApiErrorPayload {
  code: string;
  details?: unknown;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T | null;
  error: ApiErrorPayload | null;
}

export interface PaginatedData<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface RetriableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}
