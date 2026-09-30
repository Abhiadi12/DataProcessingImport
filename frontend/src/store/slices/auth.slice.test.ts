import { describe, expect, it } from "vitest";
import { mockAuthSession, mockUser } from "@/testing/mockData";
import {
  authReducer,
  clearSession,
  selectAccessToken,
  selectCurrentUser,
  selectIsAuthenticated,
  setSession,
} from "./auth.slice";

describe("auth slice", () => {
  it("starts with no session", () => {
    const state = authReducer(undefined, { type: "@@INIT" });

    expect(state).toEqual({ accessToken: null, user: null });
  });

  it("setSession stores the access token and user", () => {
    const state = authReducer(undefined, setSession(mockAuthSession));

    expect(state.accessToken).toBe(mockAuthSession.accessToken);
    expect(state.user).toEqual(mockUser);
  });

  it("clearSession resets to the initial state", () => {
    const loggedIn = authReducer(undefined, setSession(mockAuthSession));
    const state = authReducer(loggedIn, clearSession());

    expect(state).toEqual({ accessToken: null, user: null });
  });

  it("selectors read from the auth state", () => {
    const loggedIn = { auth: authReducer(undefined, setSession(mockAuthSession)) };
    const loggedOut = { auth: authReducer(undefined, clearSession()) };

    expect(selectAccessToken(loggedIn)).toBe(mockAuthSession.accessToken);
    expect(selectCurrentUser(loggedIn)).toEqual(mockUser);
    expect(selectIsAuthenticated(loggedIn)).toBe(true);
    expect(selectIsAuthenticated(loggedOut)).toBe(false);
  });
});
