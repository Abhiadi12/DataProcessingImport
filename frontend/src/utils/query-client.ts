import { QueryClient } from "@tanstack/react-query";
import { QUERY_DEFAULTS } from "@/constants";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: QUERY_DEFAULTS.STALE_TIME_MS,
      retry: QUERY_DEFAULTS.RETRY_COUNT,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    },
  },
});
