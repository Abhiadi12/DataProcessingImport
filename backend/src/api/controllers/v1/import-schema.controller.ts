import type { NextFunction, Request, Response } from "express";
import { AUTH_MESSAGES, IMPORT_SCHEMA_MESSAGES } from "../../../constants/index.js";
import { container } from "../../../container.js";
import { UnauthorizedError } from "../../../errors/unauthorized.error.js";
import { ok } from "../../../utils/create-response.js";
import type {
  ImportSchemaIdParam,
  ListImportSchemasQuery,
} from "../../schemas/v1/import-schema.schema.js";
import type { ProjectIdParam } from "../../schemas/v1/project.schema.js";

export async function createProjectImportSchema(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError(AUTH_MESSAGES.NOT_AUTHENTICATED);
    const { id } = req.validatedParams as ProjectIdParam;
    const schema = await container.importSchemaService.createForProject(req.user, id, req.body);
    res.status(201).json(ok(IMPORT_SCHEMA_MESSAGES.CREATED, schema));
  } catch (error) {
    next(error);
  }
}

export async function createGlobalImportSchema(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError(AUTH_MESSAGES.NOT_AUTHENTICATED);
    const schema = await container.importSchemaService.createGlobal(req.user, req.body);
    res.status(201).json(ok(IMPORT_SCHEMA_MESSAGES.CREATED, schema));
  } catch (error) {
    next(error);
  }
}

export async function listProjectImportSchemas(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { id } = req.validatedParams as ProjectIdParam;
    const query = req.validatedQuery as ListImportSchemasQuery;
    const schemas = await container.importSchemaService.list(id, query);
    res.json(ok(IMPORT_SCHEMA_MESSAGES.LIST_FETCHED, schemas));
  } catch (error) {
    next(error);
  }
}

export async function getImportSchemaById(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError(AUTH_MESSAGES.NOT_AUTHENTICATED);
    const { id } = req.validatedParams as ImportSchemaIdParam;
    const schema = await container.importSchemaService.getById(req.user, id);
    res.json(ok(IMPORT_SCHEMA_MESSAGES.FETCHED, schema));
  } catch (error) {
    next(error);
  }
}

export async function archiveImportSchema(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError(AUTH_MESSAGES.NOT_AUTHENTICATED);
    const { id } = req.validatedParams as ImportSchemaIdParam;
    const schema = await container.importSchemaService.archive(req.user, id);
    res.json(ok(IMPORT_SCHEMA_MESSAGES.ARCHIVED, schema));
  } catch (error) {
    next(error);
  }
}
