import { Role } from "@prisma/client";
import type { NextFunction, Request, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ForbiddenError } from "../../errors/forbidden.error.js";
import { UnauthorizedError } from "../../errors/unauthorized.error.js";
import { mockProjectId, mockUserId } from "../../testing/mockData/index.js";
import { requireProjectAccess } from "./require-project-access.middleware.js";

const projectService = vi.hoisted(() => ({ isMember: vi.fn() }));
vi.mock("../../container.js", () => ({ container: { projectService } }));

const res = {} as Response;

function requestAs(role: Role | undefined): Request {
  return {
    ...(role ? { user: { id: mockUserId, role } } : {}),
    validatedParams: { id: mockProjectId },
  } as Request;
}

describe("requireProjectAccess", () => {
  let next: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    next = vi.fn();
    projectService.isMember.mockReset();
  });

  it("rejects an unauthenticated request", async () => {
    await requireProjectAccess()(requestAs(undefined), res, next as NextFunction);

    expect(next.mock.calls[0]![0]).toBeInstanceOf(UnauthorizedError);
    expect(projectService.isMember).not.toHaveBeenCalled();
  });

  describe("default bypass (ADMIN only)", () => {
    it("lets an ADMIN through without a membership lookup", async () => {
      await requireProjectAccess()(requestAs(Role.ADMIN), res, next as NextFunction);

      expect(next).toHaveBeenCalledWith();
      expect(projectService.isMember).not.toHaveBeenCalled();
    });

    // The rule the builder asked about: a manager who isn't on the project
    // must NOT get through on these routes.
    it("makes a MANAGER prove membership", async () => {
      projectService.isMember.mockResolvedValue(false);

      await requireProjectAccess()(requestAs(Role.MANAGER), res, next as NextFunction);

      expect(projectService.isMember).toHaveBeenCalledWith(mockProjectId, mockUserId);
      expect(next.mock.calls[0]![0]).toBeInstanceOf(ForbiddenError);
    });

    it("lets a MANAGER who IS a member through", async () => {
      projectService.isMember.mockResolvedValue(true);

      await requireProjectAccess()(requestAs(Role.MANAGER), res, next as NextFunction);

      expect(next).toHaveBeenCalledWith();
    });

    it("rejects a MEMBER who isn't on the project", async () => {
      projectService.isMember.mockResolvedValue(false);

      await requireProjectAccess()(requestAs(Role.MEMBER), res, next as NextFunction);

      expect(next.mock.calls[0]![0]).toBeInstanceOf(ForbiddenError);
    });
  });

  describe("bypass from MANAGER (the member list)", () => {
    it("lets any MANAGER through without a membership lookup", async () => {
      await requireProjectAccess(Role.MANAGER)(requestAs(Role.MANAGER), res, next as NextFunction);

      expect(next).toHaveBeenCalledWith();
      expect(projectService.isMember).not.toHaveBeenCalled();
    });

    it("still makes a MEMBER prove membership", async () => {
      projectService.isMember.mockResolvedValue(true);

      await requireProjectAccess(Role.MANAGER)(requestAs(Role.MEMBER), res, next as NextFunction);

      expect(projectService.isMember).toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith();
    });
  });

  it("forwards an unexpected repository failure instead of swallowing it", async () => {
    const boom = new Error("database down");
    projectService.isMember.mockRejectedValue(boom);

    await requireProjectAccess()(requestAs(Role.MEMBER), res, next as NextFunction);

    expect(next).toHaveBeenCalledWith(boom);
  });
});
