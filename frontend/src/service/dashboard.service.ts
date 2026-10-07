import { useQuery } from "@tanstack/react-query";
import { API_ENDPOINTS, DASHBOARD_POLL_INTERVAL_MS, QUERY_KEYS } from "@/constants";
import { useAxios } from "@/hooks/useAxios";
import type { ApiResponse, Dashboard } from "@/types";

// The signed-in user's dashboard. An admin's numbers cover every project,
// anyone else's only the projects they are a member of — the API decides, and
// says which in `scope`.
//
// The numbers are always re-fetched on opening the page and on returning to
// the tab, and every 10 seconds while an import is running.
export const useGetDashboard = () => {
  const axios = useAxios();

  return useQuery({
    queryKey: QUERY_KEYS.DASHBOARD,
    queryFn: async () => {
      const res = await axios.get<ApiResponse<Dashboard>>(API_ENDPOINTS.DASHBOARD);
      return res.data;
    },
    staleTime: 0,
    refetchOnWindowFocus: "always",
    refetchInterval: (query) =>
      (query.state.data?.data?.activeImports ?? 0) > 0 ? DASHBOARD_POLL_INTERVAL_MS : false,
  });
};
