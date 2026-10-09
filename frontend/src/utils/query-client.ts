import { QueryClient } from "@tanstack/react-query";
import { QUERY_DEFAULTS } from "@/constants";
import { getApiErrorStatus } from "./api-error";

function shouldRetry(failureCount: number, error: unknown): boolean {
  const status = getApiErrorStatus(error);
  if (status !== null && status >= 400 && status < 500) {
    return false;
  }
  return failureCount < QUERY_DEFAULTS.RETRY_COUNT;
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: QUERY_DEFAULTS.STALE_TIME_MS,
      retry: shouldRetry,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    },
  },
});
