import Alert from "@mui/material/Alert";
import Snackbar from "@mui/material/Snackbar";
import { NOTIFICATION_DURATION_MS } from "@/constants";
import { useAppDispatch, useAppSelector } from "@/hooks/redux.hooks";
import { hideNotification, selectNotification } from "@/store/slices/notification.slice";

// The one place notifications are shown. Trigger them with useNotify().
export function AppSnackbar() {
  const dispatch = useAppDispatch();
  const { open, message, severity } = useAppSelector(selectNotification);

  const close = () => {
    dispatch(hideNotification());
  };

  return (
    <Snackbar
      open={open}
      autoHideDuration={NOTIFICATION_DURATION_MS}
      // Clicking elsewhere on the page shouldn't dismiss a message the user
      // may not have read yet.
      onClose={(_event, reason) => {
        if (reason !== "clickaway") {
          close();
        }
      }}
      anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
    >
      <Alert severity={severity} variant="filled" onClose={close}>
        {message}
      </Alert>
    </Snackbar>
  );
}
