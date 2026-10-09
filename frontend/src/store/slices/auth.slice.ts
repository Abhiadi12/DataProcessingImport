import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { AUTH_STATUS } from "@/constants";
import type { AuthSession, AuthState, PublicUser, RootState } from "@/types";

// INFO: accessToken in the state memory , as we have refresh token inside httpOnly cookie
// Starts as "checking": on every page load the token is gone from memory, but
// the refresh cookie may still be valid — useRestoreSession finds out.
const initialState: AuthState = {
  status: AUTH_STATUS.CHECKING,
  accessToken: null,
  user: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setSession(state, action: PayloadAction<AuthSession>) {
      state.status = AUTH_STATUS.AUTHENTICATED;
      state.accessToken = action.payload.accessToken;
      state.user = action.payload.user;
    },
    // After a profile edit: the token is unchanged, only the user's details.
    setUser(state, action: PayloadAction<PublicUser>) {
      state.user = action.payload;
    },
    clearSession() {
      return { status: AUTH_STATUS.ANONYMOUS, accessToken: null, user: null };
    },
  },
});

export const { setSession, setUser, clearSession } = authSlice.actions;
export const authReducer = authSlice.reducer;

export const selectAuthStatus = (state: RootState) => state.auth.status;
export const selectAccessToken = (state: RootState) => state.auth.accessToken;
export const selectCurrentUser = (state: RootState) => state.auth.user;
export const selectIsAuthenticated = (state: RootState) =>
  state.auth.status === AUTH_STATUS.AUTHENTICATED;
