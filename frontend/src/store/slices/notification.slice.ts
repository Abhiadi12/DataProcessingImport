import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { NOTIFICATION_SEVERITY } from "@/constants";
import type { NotificationPayload, NotificationState, RootState } from "@/types";

const initialState: NotificationState = {
  open: false,
  message: "",
  severity: NOTIFICATION_SEVERITY.SUCCESS,
};

const notificationSlice = createSlice({
  name: "notification",
  initialState,
  reducers: {
    showNotification(_state, action: PayloadAction<NotificationPayload>) {
      return { open: true, ...action.payload };
    },
    // Keeps message and severity so the snackbar doesn't go blank while it
    // animates out.
    hideNotification(state) {
      state.open = false;
    },
  },
});

export const { showNotification, hideNotification } = notificationSlice.actions;
export const notificationReducer = notificationSlice.reducer;

export const selectNotification = (state: RootState) => state.notification;
