import { useMemo } from "react";
import { NOTIFICATION_SEVERITY } from "@/constants";
import { showNotification } from "@/store/slices/notification.slice";
import { useAppDispatch } from "./redux.hooks";

// notify.success(message) / notify.error(message) — shown by <AppSnackbar />.
export function useNotify() {
  const dispatch = useAppDispatch();

  return useMemo(
    () => ({
      success: (message: string) =>
        dispatch(showNotification({ message, severity: NOTIFICATION_SEVERITY.SUCCESS })),
      error: (message: string) =>
        dispatch(showNotification({ message, severity: NOTIFICATION_SEVERITY.ERROR })),
    }),
    [dispatch],
  );
}
