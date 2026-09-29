import { Role } from "@prisma/client";
import type { Prisma } from "@prisma/client";
import { IMPORT_SCHEMA_MESSAGES, PROJECT_MESSAGES, ROLE_RANK } from "../../constants/index.js";
import { ConflictError } from "../../errors/conflict.error.js";
import { ForbiddenError } from "../../errors/forbidden.error.js";
import { NotFoundError } from "../../errors/not-found.error.js";
import type {
  ImportSchemaRepository,
  ImportSchemaWithCounts,
} from "../../repositories/v1/import-schema.repository.js";
import type { ProjectRepository } from "../../repositories/v1/project.repository.js";
import type { Paginated } from "../../types/pagination.js";
import type { CreateImportSchemaBody } from "../../api/schemas/v1/import-schema.schema.js";
import type { AuthenticatedUser } from "./auth.service.js";
import {
  toImportSchemaDetailView,
  toImportSchemaView,
  type ImportSchemaView,
} from "./import-schema.mapper.js";

export interface ListImportSchemasInput {
  page: number;
  limit: number;
}

export class ImportSchemaService {
  constructor(
    private readonly importSchemaRepository: ImportSchemaRepository,
    private readonly projectRepository: ProjectRepository,
  ) {}

  async createForProject(
    user: AuthenticatedUser,
    projectId: string,
    input: CreateImportSchemaBody,
  ): Promise<ImportSchemaView> {
    const clashingGlobal = await this.importSchemaRepository.findGlobalByName(input.name);
    if (clashingGlobal) {
      throw new ConflictError(IMPORT_SCHEMA_MESSAGES.GLOBAL_NAME_TAKEN);
    }

    const schema = await this.importSchemaRepository.create({
      projectId,
      createdById: user.id,
      name: input.name,
      ...(input.description === undefined ? {} : { description: input.description }),
      fields: input.fields as Prisma.InputJsonValue,
    });

    return toImportSchemaView(schema);
  }

  async createGlobal(
    user: AuthenticatedUser,
    input: CreateImportSchemaBody,
  ): Promise<ImportSchemaView> {
    const existing = await this.importSchemaRepository.findGlobalByName(input.name);
    if (existing) {
      throw new ConflictError(IMPORT_SCHEMA_MESSAGES.GLOBAL_NAME_TAKEN);
    }

    const schema = await this.importSchemaRepository.create({
      projectId: null,
      createdById: user.id,
      name: input.name,
      ...(input.description === undefined ? {} : { description: input.description }),
      fields: input.fields as Prisma.InputJsonValue,
    });

    return toImportSchemaView(schema);
  }

  async list(
    projectId: string,
    { page, limit }: ListImportSchemasInput,
  ): Promise<Paginated<ImportSchemaView>> {
    const { schemas, total } = await this.importSchemaRepository.listVisible(projectId, {
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      items: schemas.map(toImportSchemaView),
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getById(user: AuthenticatedUser, id: string): Promise<ImportSchemaView> {
    const schema = await this.requireAccessibleSchema(user, id);
    return toImportSchemaDetailView(schema);
  }

  async archive(user: AuthenticatedUser, id: string): Promise<ImportSchemaView> {
    const schema = await this.requireAccessibleSchema(user, id);

    if (schema.projectId === null && user.role !== Role.ADMIN) {
      throw new ForbiddenError(IMPORT_SCHEMA_MESSAGES.GLOBAL_REQUIRES_ADMIN);
    }

    if (schema.archivedAt !== null) {
      throw new ConflictError(IMPORT_SCHEMA_MESSAGES.ALREADY_ARCHIVED);
    }

    if (schema._count.imports > 0) {
      throw new ConflictError(IMPORT_SCHEMA_MESSAGES.IN_USE);
    }

    return toImportSchemaView(await this.importSchemaRepository.archive(id));
  }

  private async requireAccessibleSchema(
    user: AuthenticatedUser,
    id: string,
  ): Promise<ImportSchemaWithCounts> {
    const schema = await this.importSchemaRepository.findById(id);
    if (!schema) {
      throw new NotFoundError(IMPORT_SCHEMA_MESSAGES.NOT_FOUND);
    }

    if (schema.projectId === null) return schema;
    if (ROLE_RANK[user.role] >= ROLE_RANK[Role.ADMIN]) return schema;

    const isMember = await this.projectRepository.isMember(schema.projectId, user.id);
    if (!isMember) {
      throw new ForbiddenError(PROJECT_MESSAGES.NOT_A_MEMBER);
    }

    return schema;
  }
}
