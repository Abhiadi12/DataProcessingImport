import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { API_ENDPOINTS, DEFAULT_PAGE_SIZE, QUERY_KEYS } from "@/constants";
import { useAppDispatch } from "@/hooks/redux.hooks";
import { useAxios } from "@/hooks/useAxios";
import { clearSession, setUser } from "@/store/slices/auth.slice";
import type {
  ApiResponse,
  ChangePasswordInput,
  PaginatedData,
  PaginationParams,
  PublicUser,
  UpdateProfileInput,
  UpdateUserVariables,
} from "@/types";

export const useGetMe = () => {
  const axios = useAxios();

  return useQuery({
    queryKey: QUERY_KEYS.ME,
    queryFn: async () => {
      const res = await axios.get<ApiResponse<PublicUser>>(API_ENDPOINTS.USERS.ME);
      return res.data;
    },
  });
};

export const useUpdateProfile = () => {
  const axios = useAxios();
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateProfileInput) => {
      const res = await axios.patch<ApiResponse<PublicUser>>(API_ENDPOINTS.USERS.ME, input);
      return res.data;
    },
    onSuccess: (res) => {
      if (res.data) {
        // The header reads the user from the store, the profile page from the
        // query cache — update both so neither shows the old name.
        dispatch(setUser(res.data));
        queryClient.setQueryData(QUERY_KEYS.ME, res);
      }
    },
  });
};

// The backend revokes every session and clears the refresh cookie when the
// password changes, so the local session is dropped too; RequireAuth then
// sends the user to /login.
export const useChangePassword = () => {
  const axios = useAxios();
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: ChangePasswordInput) => {
      const res = await axios.patch<ApiResponse<null>>(API_ENDPOINTS.USERS.MY_PASSWORD, input);
      return res.data;
    },
    onSuccess: () => {
      dispatch(clearSession());
      queryClient.clear();
    },
  });
};

// Admin only. keepPreviousData keeps the current rows on screen while the
// next page loads, instead of flashing an empty table.
export const useGetUsers = ({ page = 1, limit = DEFAULT_PAGE_SIZE }: PaginationParams = {}) => {
  const axios = useAxios();

  return useQuery({
    queryKey: [...QUERY_KEYS.USERS_LIST, page, limit],
    queryFn: async () => {
      const res = await axios.get<ApiResponse<PaginatedData<PublicUser>>>(
        API_ENDPOINTS.USERS.LIST,
        { params: { page, limit } },
      );
      return res.data;
    },
    placeholderData: keepPreviousData,
  });
};

// Admin only. Pass null to keep the query idle (e.g. a closed details dialog).
export const useGetUser = (id: string | null) => {
  const axios = useAxios();

  return useQuery({
    queryKey: [...QUERY_KEYS.USER_DETAIL, id],
    queryFn: async () => {
      const res = await axios.get<ApiResponse<PublicUser>>(API_ENDPOINTS.USERS.byId(id ?? ""));
      return res.data;
    },
    enabled: Boolean(id),
  });
};

// Admin only: change another user's role or active status.
export const useUpdateUser = () => {
  const axios = useAxios();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, input }: UpdateUserVariables) => {
      const res = await axios.patch<ApiResponse<PublicUser>>(API_ENDPOINTS.USERS.byId(id), input);
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USERS_ALL }),
  });
};
