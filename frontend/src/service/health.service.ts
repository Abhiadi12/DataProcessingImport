import { useQuery } from "@tanstack/react-query";
import { API_ENDPOINTS, API_ROOT_URL, HEALTH_POLL_INTERVAL_MS, QUERY_KEYS } from "@/constants";
import { useAxios } from "@/hooks/useAxios";
import type { ApiResponse, HealthStatus } from "@/types";

export const useGetHealth = () => {
  const axios = useAxios();

  return useQuery({
    queryKey: QUERY_KEYS.HEALTH,
    queryFn: async () => {
      const res = await axios.get<ApiResponse<HealthStatus>>(API_ENDPOINTS.HEALTH, {
        baseURL: API_ROOT_URL,
      });
      return res.data;
    },
    refetchInterval: HEALTH_POLL_INTERVAL_MS,
    retry: false,
  });
};
