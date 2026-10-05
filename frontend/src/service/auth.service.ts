import { useMutation, useQueryClient } from "@tanstack/react-query";
import { API_ENDPOINTS } from "@/constants";
import { useAppDispatch } from "@/hooks/redux.hooks";
import { useAxios } from "@/hooks/useAxios";
import { clearSession, setSession } from "@/store/slices/auth.slice";
import type { ApiResponse, AuthSession, LoginInput, PublicUser, RegisterInput } from "@/types";

// Registering does not sign the user in — the backend returns the new user
// only, with no tokens.
export const useRegister = () => {
  const axios = useAxios();

  return useMutation({
    mutationFn: async (input: RegisterInput) => {
      const res = await axios.post<ApiResponse<PublicUser>>(API_ENDPOINTS.AUTH.REGISTER, input);
      return res.data;
    },
  });
};

// Storing the session is all a login needs: GuestOnly sees the status change
// and redirects off the login page by itself.
export const useLogin = () => {
  const axios = useAxios();
  const dispatch = useAppDispatch();

  return useMutation({
    mutationFn: async (input: LoginInput) => {
      const res = await axios.post<ApiResponse<AuthSession>>(API_ENDPOINTS.AUTH.LOGIN, input);
      return res.data;
    },
    onSuccess: (res) => {
      if (res.data) {
        dispatch(setSession(res.data));
      }
    },
  });
};

// Signs out this device. The local session is dropped even if the request
// fails — the user asked to leave, and the cached data is another user's
// problem if it stays.
export const useLogout = () => {
  const axios = useAxios();
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const res = await axios.post<ApiResponse<null>>(API_ENDPOINTS.AUTH.LOGOUT);
      return res.data;
    },
    onSettled: () => {
      dispatch(clearSession());
      queryClient.clear();
    },
  });
};

// Revokes every session on every device. Unlike useLogout this only clears
// locally on success: if it failed, the other devices are still signed in and
// the user must be told, not shown a login page as if it had worked.
export const useLogoutAll = () => {
  const axios = useAxios();
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const res = await axios.post<ApiResponse<null>>(API_ENDPOINTS.AUTH.LOGOUT_ALL);
      return res.data;
    },
    onSuccess: () => {
      dispatch(clearSession());
      queryClient.clear();
    },
  });
};
