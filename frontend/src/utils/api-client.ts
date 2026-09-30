import axios, { isAxiosError } from "axios";
import {
  API_BASE_URL,
  API_ENDPOINTS,
  API_TIMEOUT_MS,
  HTTP_STATUS,
  NO_REFRESH_ENDPOINTS,
} from "@/constants";
import { store } from "@/store";
import { clearSession, setSession } from "@/store/slices/auth.slice";
import type { ApiResponse, AuthSession, RetriableRequestConfig } from "@/types";

// The one axios instance the app uses. Components reach it through useAxios();
// only this module knows about tokens.
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT_MS,
});

// Separate instance with no interceptors, so a failing refresh can't trigger
// another refresh.
const refreshClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT_MS,
});

apiClient.interceptors.request.use((config) => {
  const token = store.getState().auth.accessToken;
  if (token) {
    config.headers.set("Authorization", `Bearer ${token}`);
  }
  return config;
});

// Single-flight: when several requests 401 at once, they all wait on the same
// refresh. The backend rotates refresh tokens and treats a second use of the
// old one as theft, so parallel refreshes would log the user out.
let pendingRefresh: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  try {
    const { data } = await refreshClient.post<ApiResponse<AuthSession>>(API_ENDPOINTS.AUTH.REFRESH);
    if (!data.data) {
      store.dispatch(clearSession());
      return null;
    }
    store.dispatch(setSession(data.data));
    return data.data.accessToken;
  } catch {
    store.dispatch(clearSession());
    return null;
  }
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (!isAxiosError(error) || !error.config) {
      return Promise.reject(error);
    }

    const request = error.config as RetriableRequestConfig;
    const isRefreshable =
      error.response?.status === HTTP_STATUS.UNAUTHORIZED &&
      !request._retry &&
      !NO_REFRESH_ENDPOINTS.includes(request.url ?? "");

    if (!isRefreshable) {
      return Promise.reject(error);
    }

    request._retry = true;

    // A request sent with an older token can 401 after another request has
    // already refreshed. Replay it with the current token instead of rotating
    // the refresh token a second time.
    const currentToken = store.getState().auth.accessToken;
    if (currentToken && request.headers.get("Authorization") !== `Bearer ${currentToken}`) {
      return apiClient(request);
    }

    pendingRefresh ??= refreshAccessToken().finally(() => {
      pendingRefresh = null;
    });

    const token = await pendingRefresh;
    if (!token) {
      return Promise.reject(error);
    }

    // Replaying through apiClient re-runs the request interceptor, which
    // attaches the new token from the store.
    return apiClient(request);
  },
);
