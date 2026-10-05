import { describe, expect, it } from "vitest";
import { createTestStore } from "@/testing/factories";
import {
  mockAnonymousAuthState,
  mockAuthSession,
  mockAuthenticatedAuthState,
  mockCheckingAuthState,
  mockUser,
} from "@/testing/mockData";
import {
  authReducer,
  clearSession,
  selectAccessToken,
  selectAuthStatus,
  selectCurrentUser,
  selectIsAuthenticated,
  setSession,
} from "./auth.slice";

describe("auth slice", () => {
  it("starts as checking, with no session", () => {
    const state = authReducer(undefined, { type: "@@INIT" });

    expect(state).toEqual(mockCheckingAuthState);
  });

  it("setSession marks the user authenticated and stores token and user", () => {
    const state = authReducer(undefined, setSession(mockAuthSession));

    expect(state).toEqual(mockAuthenticatedAuthState);
  });

  it("clearSession marks the user anonymous, not checking", () => {
    const loggedIn = authReducer(undefined, setSession(mockAuthSession));
    const state = authReducer(loggedIn, clearSession());

    expect(state).toEqual(mockAnonymousAuthState);
  });

  it("selectors read from the auth state", () => {
    const loggedIn = createTestStore(mockAuthenticatedAuthState).getState();

    expect(selectAuthStatus(loggedIn)).toBe("authenticated");
    expect(selectAccessToken(loggedIn)).toBe(mockAuthSession.accessToken);
    expect(selectCurrentUser(loggedIn)).toEqual(mockUser);
    expect(selectIsAuthenticated(loggedIn)).toBe(true);
    expect(selectIsAuthenticated(createTestStore(mockAnonymousAuthState).getState())).toBe(false);
    expect(selectIsAuthenticated(createTestStore(mockCheckingAuthState).getState())).toBe(false);
  });
});
