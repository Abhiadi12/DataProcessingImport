import { Role } from "@prisma/client";
import type { NextFunction, Request, Response } from "express";
import { AUTH_MESSAGES, PROJECT_MESSAGES } from "../../constants/index.js";
import { container } from "../../container.js";
import { ForbiddenError } from "../../errors/forbidden.error.js";
import { UnauthorizedError } from "../../errors/unauthorized.error.js";
import type { ProjectIdParam } from "../schemas/v1/project.schema.js";

export async function requireProjectAccess(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError(AUTH_MESSAGES.NOT_AUTHENTICATED);

    //INFO: Admins have access to all projects, so no need to check membership
    if (req.user.role === Role.ADMIN) {
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
}
