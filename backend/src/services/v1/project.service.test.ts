import { Role } from "@prisma/client";
import { beforeEach, describe, expect, it } from "vitest";
import { ConflictError } from "../../errors/conflict.error.js";
import { NotFoundError } from "../../errors/not-found.error.js";
import {
  asProjectRepository,
  asUserRepository,
  buildProject,
  buildProjectMember,
  buildUser,
  createFakeProjectRepository,
  createFakeUserRepository,
  type FakeProjectRepository,
  type FakeUserRepository,
} from "../../testing/factories.js";
import {
  mockCreateProjectInput,
  mockProjectId,
  mockUnknownEmail,
  mockUser,
  mockUserId,
} from "../../testing/mockData/index.js";
import { ProjectService } from "./project.service.js";

const page = { page: 1, limit: 10 };

describe("ProjectService", () => {
  let projects: FakeProjectRepository;
  let users: FakeUserRepository;
  let service: ProjectService;

  //INFO: Fresh fakes per test: a call recorded in one test must never be visible
  // to the next one.
  beforeEach(() => {
    projects = createFakeProjectRepository();
    users = createFakeUserRepository();
    service = new ProjectService(asProjectRepository(projects), asUserRepository(users));
  });

  describe("createProject", () => {
    it("passes the creator's id through, so they become the first member", async () => {
      projects.create.mockResolvedValue(buildProject());

      await service.createProject(mockUserId, mockCreateProjectInput);

      expect(projects.create).toHaveBeenCalledWith(mockCreateProjectInput, mockUserId);
    });
  });

  describe("listProjects", () => {
    it("reads every project for an ADMIN", async () => {
      projects.list.mockResolvedValue({ projects: [buildProject()], total: 1 });

      const result = await service.listProjects({ id: mockUserId, role: Role.ADMIN }, page);

      expect(projects.list).toHaveBeenCalledWith({ skip: 0, take: 10 });
      expect(projects.listForMember).not.toHaveBeenCalled();
      expect(result.items).toHaveLength(1);
    });

    it("reads only their own projects for a MANAGER", async () => {
      projects.listForMember.mockResolvedValue({ projects: [], total: 0 });

      await service.listProjects({ id: mockUserId, role: Role.MANAGER }, page);

      expect(projects.listForMember).toHaveBeenCalledWith(mockUserId, { skip: 0, take: 10 });
      expect(projects.list).not.toHaveBeenCalled();
    });

    it("reads only their own projects for a MEMBER", async () => {
      projects.listForMember.mockResolvedValue({ projects: [], total: 0 });

      await service.listProjects({ id: mockUserId, role: Role.MEMBER }, page);

      expect(projects.listForMember).toHaveBeenCalled();
      expect(projects.list).not.toHaveBeenCalled();
    });

    it("turns page and limit into skip and take", async () => {
      projects.list.mockResolvedValue({ projects: [], total: 0 });

      await service.listProjects({ id: mockUserId, role: Role.ADMIN }, { page: 3, limit: 25 });

      expect(projects.list).toHaveBeenCalledWith({ skip: 50, take: 25 });
    });

    it("rounds totalPages up, so a partial last page still counts", async () => {
      projects.list.mockResolvedValue({ projects: [], total: 21 });

      const result = await service.listProjects({ id: mockUserId, role: Role.ADMIN }, page);

      expect(result).toMatchObject({ total: 21, page: 1, limit: 10, totalPages: 3 });
    });
  });

  describe("getProject", () => {
    it("returns the project", async () => {
      projects.findById.mockResolvedValue(buildProject());

      await expect(service.getProject(mockProjectId)).resolves.toMatchObject({
        id: mockProjectId,
      });
    });

    it("throws NotFoundError when it doesn't exist", async () => {
      projects.findById.mockResolvedValue(null);

      await expect(service.getProject(mockProjectId)).rejects.toThrow(NotFoundError);
    });
  });

  describe("listMembers", () => {
    it("checks the project exists first, so an unknown id 404s instead of returning []", async () => {
      projects.findById.mockResolvedValue(null);

      await expect(service.listMembers(mockProjectId, page)).rejects.toThrow(NotFoundError);
      expect(projects.listMembers).not.toHaveBeenCalled();
    });

    it("flattens each membership into a view with no password hash", async () => {
      projects.findById.mockResolvedValue(buildProject());
      projects.listMembers.mockResolvedValue({ members: [buildProjectMember()], total: 1 });

      const result = await service.listMembers(mockProjectId, page);

      expect(result.items[0]).toEqual({
        userId: mockUser.id,
        name: mockUser.name,
        email: mockUser.email,
        role: mockUser.role,
        isActive: mockUser.isActive,
        joinedAt: new Date("2026-01-02T00:00:00Z"),
      });
      expect(result.items[0]).not.toHaveProperty("passwordHash");
    });
  });

  describe("addMember", () => {
    it("looks the user up by email and adds them by id", async () => {
      projects.findById.mockResolvedValue(buildProject());
      users.findByEmail.mockResolvedValue(buildUser());
      projects.addMember.mockResolvedValue(buildProjectMember());

      await service.addMember(mockProjectId, mockUser.email);

      expect(users.findByEmail).toHaveBeenCalledWith(mockUser.email);
      expect(projects.addMember).toHaveBeenCalledWith(mockProjectId, mockUserId);
    });

    it("404s on the USER when that email isn't registered", async () => {
      projects.findById.mockResolvedValue(buildProject());
      users.findByEmail.mockResolvedValue(null);

      await expect(service.addMember(mockProjectId, mockUnknownEmail)).rejects.toThrow(
        NotFoundError,
      );
      expect(projects.addMember).not.toHaveBeenCalled();
    });

    it("lets the repository's duplicate ConflictError through", async () => {
      projects.findById.mockResolvedValue(buildProject());
      users.findByEmail.mockResolvedValue(buildUser());
      projects.addMember.mockRejectedValue(new ConflictError("already a member"));

      await expect(service.addMember(mockProjectId, mockUser.email)).rejects.toThrow(ConflictError);
    });
  });

  describe("removeMember", () => {
    it("checks the project exists before touching membership", async () => {
      projects.findById.mockResolvedValue(null);

      await expect(service.removeMember(mockProjectId, mockUserId)).rejects.toThrow(NotFoundError);
      expect(projects.removeMember).not.toHaveBeenCalled();
    });

    it("delegates to the repository, which owns the last-member rule", async () => {
      projects.findById.mockResolvedValue(buildProject());

      await service.removeMember(mockProjectId, mockUserId);

      expect(projects.removeMember).toHaveBeenCalledWith(mockProjectId, mockUserId);
    });
  });
});
