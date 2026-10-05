import { useEffect } from "react";
import { AUTH_STATUS } from "@/constants";
import { selectAuthStatus } from "@/store/slices/auth.slice";
import { refreshSession } from "@/utils/api-client";
import { useAppSelector } from "./redux.hooks";

// Runs once on app start: the access token doesn't survive a reload, so ask
// the backend for a new one using the refresh cookie. Success moves the status
// to "authenticated", failure to "anonymous" — either way guards stop waiting.
export function useRestoreSession() {
  const status = useAppSelector(selectAuthStatus);

  useEffect(() => {
    if (status === AUTH_STATUS.CHECKING) {
      void refreshSession();
    }
  }, [status]);
}
