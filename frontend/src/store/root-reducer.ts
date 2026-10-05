import { combineReducers } from "@reduxjs/toolkit";
import { authReducer } from "./slices/auth.slice";
import { notificationReducer } from "./slices/notification.slice";

// Separate from the store instance so tests can build their own store from
// the same reducers.
export const rootReducer = combineReducers({
  auth: authReducer,
  notification: notificationReducer,
});
