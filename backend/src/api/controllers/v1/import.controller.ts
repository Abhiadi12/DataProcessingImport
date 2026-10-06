import type { NextFunction, Request, Response } from "express";
import { AUTH_MESSAGES, IMPORT_MESSAGES } from "../../../constants/index.js";
import { container } from "../../../container.js";
import { UnauthorizedError } from "../../../errors/unauthorized.error.js";
import { ok } from "../../../utils/create-response.js";
import type { ImportIdParam, ListImportsQuery } from "../../schemas/v1/import.schema.js";
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

export async function listImports(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.validatedParams as ProjectIdParam;
    const query = req.validatedQuery as ListImportsQuery;
    const imports = await container.importService.list(id, query);
    res.json(ok(IMPORT_MESSAGES.LIST_FETCHED, imports));
  } catch (error) {
    next(error);
  }
}

export async function getImportById(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError(AUTH_MESSAGES.NOT_AUTHENTICATED);
    const { id } = req.validatedParams as ImportIdParam;
    const record = await container.importService.getDetail(req.user, id);
    res.json(ok(IMPORT_MESSAGES.FETCHED, record));
  } catch (error) {
    next(error);
  }
}

export async function getImportProgress(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError(AUTH_MESSAGES.NOT_AUTHENTICATED);
    const { id } = req.validatedParams as ImportIdParam;
    const progress = await container.importService.getProgress(req.user, id);
    // Polled frequently while an import runs, so make sure nothing caches it.
    res.set("Cache-Control", "no-store");
    res.json(ok(IMPORT_MESSAGES.PROGRESS_FETCHED, progress));
  } catch (error) {
    next(error);
  }
}

export async function cancelImport(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError(AUTH_MESSAGES.NOT_AUTHENTICATED);
    const { id } = req.validatedParams as ImportIdParam;
    const record = await container.importService.cancel(req.user, id);
    // 202: cancellation is REQUESTED. A running worker stops at the next batch
    // boundary, so the import may still be PROCESSING when this returns.
    res.status(202).json(ok(IMPORT_MESSAGES.CANCELLED, record));
  } catch (error) {
    next(error);
  }
}

export async function downloadImport(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError(AUTH_MESSAGES.NOT_AUTHENTICATED);
    const { id } = req.validatedParams as ImportIdParam;
    const download = await container.importService.getDownloadUrl(req.user, id);
    res.json(ok(IMPORT_MESSAGES.DOWNLOAD_READY, download));
  } catch (error) {
    next(error);
  }
}

export async function downloadErrorReport(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError(AUTH_MESSAGES.NOT_AUTHENTICATED);
    const { id } = req.validatedParams as ImportIdParam;
    const download = await container.importService.getErrorReportUrl(req.user, id);
    res.json(ok(IMPORT_MESSAGES.DOWNLOAD_READY, download));
  } catch (error) {
    next(error);
  }
}
