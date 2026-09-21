import type { User } from "@prisma/client";
import { vi } from "vitest";
import type { UserRepository } from "../repositories/v1/user.repository.js";
import { mockUser } from "./mockData/index.js";

export function buildUser(overrides: Partial<User> = {}): User {
  return { ...mockUser, ...overrides };
}

//INFO: A stand-in for UserRepository whose methods do nothing until a test tells
// them what to return (e.g. repo.findByEmail.mockResolvedValue(user)).
export function createFakeUserRepository() {
  return {
    create: vi.fn<UserRepository["create"]>(),
    findByEmail: vi.fn<UserRepository["findByEmail"]>(),
    findById: vi.fn<UserRepository["findById"]>(),
  };
}

export type FakeUserRepository = ReturnType<typeof createFakeUserRepository>;

export function asUserRepository(fake: FakeUserRepository): UserRepository {
  return fake as unknown as UserRepository;
}
