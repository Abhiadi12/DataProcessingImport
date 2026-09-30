import type { AuthSession } from "@/types";
import { mockUser } from "./user.mockData";

export const mockAuthSession: AuthSession = {
  accessToken: "mock-access-token",
  tokenType: "Bearer",
  expiresIn: 900,
  user: mockUser,
};
