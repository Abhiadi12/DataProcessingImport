import type { RefreshToken, User } from "@prisma/client";
import { vi } from "vitest";
import type { RefreshTokenRepository } from "../repositories/v1/refresh-token.repository.js";
import type { UserRepository } from "../repositories/v1/user.repository.js";
import { mockRefreshToken, mockUser } from "./mockData/index.js";

export function buildUser(overrides: Partial<User> = {}): User {
  return { ...mockUser, ...overrides };
}

export function buildRefreshToken(overrides: Partial<RefreshToken> = {}): RefreshToken {
  return { ...mockRefreshToken, ...overrides };
}

export function createFakeUserRepository() {
  return {
    create: vi.fn<UserRepository["create"]>(),
    findByEmail: vi.fn<UserRepository["findByEmail"]>(),
    findById: vi.fn<UserRepository["findById"]>(),
    updateProfile: vi.fn<UserRepository["updateProfile"]>(),
    updatePasswordAndRevokeSessions: vi.fn<UserRepository["updatePasswordAndRevokeSessions"]>(),
  };
}

export function createFakeRefreshTokenRepository() {
  return {
    create: vi.fn<RefreshTokenRepository["create"]>(),
    findByHash: vi.fn<RefreshTokenRepository["findByHash"]>(),
    rotate: vi.fn<RefreshTokenRepository["rotate"]>(),
    revokeFamily: vi.fn<RefreshTokenRepository["revokeFamily"]>(),
    revokeAllForUser: vi.fn<RefreshTokenRepository["revokeAllForUser"]>(),
  };
}

export type FakeUserRepository = ReturnType<typeof createFakeUserRepository>;
export type FakeRefreshTokenRepository = ReturnType<typeof createFakeRefreshTokenRepository>;

export function asUserRepository(fake: FakeUserRepository): UserRepository {
  return fake as unknown as UserRepository;
}

export function asRefreshTokenRepository(fake: FakeRefreshTokenRepository): RefreshTokenRepository {
  return fake as unknown as RefreshTokenRepository;
}
