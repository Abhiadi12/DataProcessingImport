import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { AuthSession, AuthState, RootState } from "@/types";

// INFO: accessToken in the state memory , as we have refresh token inside httpOnly cookie
const initialState: AuthState = {
  accessToken: null,
  user: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setSession(state, action: PayloadAction<AuthSession>) {
      state.accessToken = action.payload.accessToken;
      state.user = action.payload.user;
    },
    clearSession() {
      return initialState;
    },
  },
});

export const { setSession, clearSession } = authSlice.actions;
export const authReducer = authSlice.reducer;

export const selectAccessToken = (state: RootState) => state.auth.accessToken;
export const selectCurrentUser = (state: RootState) => state.auth.user;
export const selectIsAuthenticated = (state: RootState) => state.auth.accessToken !== null;
