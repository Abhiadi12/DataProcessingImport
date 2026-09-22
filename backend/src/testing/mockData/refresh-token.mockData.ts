import type { RefreshToken } from "@prisma/client";
import { mockUserId } from "./user.mockData.js";

export const mockFamilyId = "9b2d6f0e-4c1a-4e7b-8f3d-2a5c7e9b1d40";

export const mockRefreshTokenValue = "presented-refresh-token-value";

export const mockRefreshToken: RefreshToken = {
  id: "c7e1a9d3-5b2f-4a8e-9c6d-1f3b5d7e9a20",
  userId: mockUserId,
  familyId: mockFamilyId,
  tokenHash: "placeholder-hash",
  expiresAt: new Date("2099-01-01T00:00:00Z"),
  revokedAt: null,
  createdAt: new Date("2026-01-01T00:00:00Z"),
};
