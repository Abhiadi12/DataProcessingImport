import { useQuery } from "@tanstack/react-query";
import { API_ENDPOINTS, DASHBOARD_POLL_INTERVAL_MS, QUERY_KEYS } from "@/constants";
import { useAxios } from "@/hooks/useAxios";
import type { AdminDashboard, ApiResponse, Dashboard } from "@/types";

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

//INFO: Admin only: platform-wide counts and the state of the job queue. It refreshes
// every 10 seconds for as long as the page is open — the queue numbers are a
// live reading, and an admin watching them wants to see them move.
export const useGetAdminDashboard = () => {
  const axios = useAxios();

  return useQuery({
    queryKey: QUERY_KEYS.ADMIN_DASHBOARD,
    queryFn: async () => {
      const res = await axios.get<ApiResponse<AdminDashboard>>(API_ENDPOINTS.ADMIN_DASHBOARD);
      return res.data;
    },
    staleTime: 0,
    refetchOnWindowFocus: "always",
    refetchInterval: DASHBOARD_POLL_INTERVAL_MS,
  });
};
