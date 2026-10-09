import type { User } from "@prisma/client";

export const mockUserId = "3f1c7a52-8a3e-4b8e-9d2a-0c6f1e2b7a91";

export const mockPassword = "secret-pass-1";

export const mockWrongPassword = "wrong-password";

export const mockNewPassword = "new-secret-pass-2";

export const mockUser: User = {
  id: mockUserId,
  email: "john@example.com",
  passwordHash: "$2b$12$not-a-real-hash-used-only-where-no-password-check-happens",
  name: "John Doe",
  role: "MEMBER",
  isActive: true,
  createdAt: new Date("2026-01-01T00:00:00Z"),
  updatedAt: new Date("2026-01-01T00:00:00Z"),
};
