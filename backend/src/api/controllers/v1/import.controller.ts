import type { NextFunction, Request, Response } from "express";
import { AUTH_MESSAGES, IMPORT_MESSAGES } from "../../../constants/index.js";
import { container } from "../../../container.js";
import { UnauthorizedError } from "../../../errors/unauthorized.error.js";
import { ok } from "../../../utils/create-response.js";
import type { ImportIdParam } from "../../schemas/v1/import.schema.js";
import type { ProjectIdParam } from "../../schemas/v1/project.schema.js";

export async function prepareUpload(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError(AUTH_MESSAGES.NOT_AUTHENTICATED);
    const { id } = req.validatedParams as ProjectIdParam;
    const prepared = await container.importService.prepareUpload(req.user, id, req.body);
    res.status(201).json(ok(IMPORT_MESSAGES.CREATED, prepared));
  } catch (error) {
    next(error);
  }
}

export async function startImport(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError(AUTH_MESSAGES.NOT_AUTHENTICATED);
    const { id } = req.validatedParams as ImportIdParam;
    const record = await container.importService.start(req.user, id, req.requestId);
    // 202: the work is accepted but not done. A worker picks it up from the queue.
    res.status(202).json(ok(IMPORT_MESSAGES.STARTED, record));
  } catch (error) {
    next(error);
  }
}
