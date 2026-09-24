import { Role } from "@prisma/client";
import type { NextFunction, Request, Response } from "express";
import { AUTH_MESSAGES, PROJECT_MESSAGES, ROLE_RANK } from "../../constants/index.js";
import { container } from "../../container.js";
import { ForbiddenError } from "../../errors/forbidden.error.js";
import { UnauthorizedError } from "../../errors/unauthorized.error.js";
import type { ProjectIdParam } from "../schemas/v1/project.schema.js";

/**
 *
 * @param bypassFrom - Lowest role exempt from the membership check.
 *   Defaults to `Role.ADMIN`, meaning only admins skip it.
 * @returns Express middleware that calls `next()` on success, or
 *   `next(error)` with `UnauthorizedError` (401) when unauthenticated and
 *   `ForbiddenError` (403) when the caller isn't a member.
 *
 * @example
 * // Write access: must belong to the project, unless ADMIN.
 * projectRouter.patch("/:id", authenticate, validate({ params }),
 *   requireProjectAccess(), requireRole(Role.MANAGER), handler);
 *
 * @example
 * // Member list: any MANAGER may read it; a MEMBER must belong to it.
 * projectRouter.get("/:id/members", authenticate, validate({ params }),
 *   requireProjectAccess(Role.MANAGER), handler);
 */
export function requireProjectAccess(bypassFrom: Role = Role.ADMIN) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) throw new UnauthorizedError(AUTH_MESSAGES.NOT_AUTHENTICATED);

      if (ROLE_RANK[req.user.role] >= ROLE_RANK[bypassFrom]) {
        next();
        return;
      }

      const { id } = req.validatedParams as ProjectIdParam;
      const isMember = await container.projectService.isMember(id, req.user.id);

      if (!isMember) {
        throw new ForbiddenError(PROJECT_MESSAGES.NOT_A_MEMBER);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}
