import type { Project, RefreshToken, User } from "@prisma/client";
import { vi } from "vitest";
import type {
  ProjectMemberWithUser,
  ProjectRepository,
} from "../repositories/v1/project.repository.js";
import type { RefreshTokenRepository } from "../repositories/v1/refresh-token.repository.js";
import type { UserRepository } from "../repositories/v1/user.repository.js";
import { mockProject, mockProjectMember, mockRefreshToken, mockUser } from "./mockData/index.js";

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

export function buildProject(overrides: Partial<Project> = {}): Project {
  return { ...mockProject, ...overrides };
}

export function buildProjectMember(
  overrides: Partial<ProjectMemberWithUser> = {},
): ProjectMemberWithUser {
  return { ...mockProjectMember, ...overrides };
}

export function createFakeProjectRepository() {
  return {
    create: vi.fn<ProjectRepository["create"]>(),
    findById: vi.fn<ProjectRepository["findById"]>(),
    list: vi.fn<ProjectRepository["list"]>(),
    listForMember: vi.fn<ProjectRepository["listForMember"]>(),
    isMember: vi.fn<ProjectRepository["isMember"]>(),
    update: vi.fn<ProjectRepository["update"]>(),
    delete: vi.fn<ProjectRepository["delete"]>(),
    listMembers: vi.fn<ProjectRepository["listMembers"]>(),
    addMember: vi.fn<ProjectRepository["addMember"]>(),
    removeMember: vi.fn<ProjectRepository["removeMember"]>(),
  };
}

export type FakeProjectRepository = ReturnType<typeof createFakeProjectRepository>;

export function asProjectRepository(fake: FakeProjectRepository): ProjectRepository {
  return fake as unknown as ProjectRepository;
}

export type FakeUserRepository = ReturnType<typeof createFakeUserRepository>;
export type FakeRefreshTokenRepository = ReturnType<typeof createFakeRefreshTokenRepository>;

export function asUserRepository(fake: FakeUserRepository): UserRepository {
  return fake as unknown as UserRepository;
}

export function asRefreshTokenRepository(fake: FakeRefreshTokenRepository): RefreshTokenRepository {
  return fake as unknown as RefreshTokenRepository;
}
