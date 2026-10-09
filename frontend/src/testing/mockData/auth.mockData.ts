import type { AuthSession, AuthState } from "@/types";
import { mockUser } from "./user.mockData";

export const mockAuthSession: AuthSession = {
  accessToken: "mock-access-token",
  tokenType: "Bearer",
  expiresIn: 900,
  user: mockUser,
};

export const mockCheckingAuthState: AuthState = {
  status: "checking",
  accessToken: null,
  user: null,
};

export const mockAnonymousAuthState: AuthState = {
  status: "anonymous",
  accessToken: null,
  user: null,
};

export const mockAuthenticatedAuthState: AuthState = {
  status: "authenticated",
  accessToken: mockAuthSession.accessToken,
  user: mockUser,
};
