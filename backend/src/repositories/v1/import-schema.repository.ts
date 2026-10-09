import { Prisma, type ImportSchema, type PrismaClient } from "@prisma/client";
import { IMPORT_SCHEMA_MESSAGES } from "../../constants/index.js";
import { ConflictError } from "../../errors/conflict.error.js";
import { NotFoundError } from "../../errors/not-found.error.js";

export interface CreateImportSchemaData {
  projectId: string | null;
  createdById: string;
  name: string;
  description?: string;
  fields: Prisma.InputJsonValue;
}

export interface ListImportSchemasParams {
  skip: number;
  take: number;
}

export interface ListImportSchemasResult {
  schemas: ImportSchema[];
  total: number;
}

export interface ImportSchemaWithCounts extends ImportSchema {
  _count: { imports: number };
}

export class ImportSchemaRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(data: CreateImportSchemaData): Promise<ImportSchema> {
    try {
      return await this.prisma.importSchema.create({ data });
    } catch (error) {
      throw toDomainError(error);
    }
  }

  async findById(id: string): Promise<ImportSchemaWithCounts | null> {
    return this.prisma.importSchema.findUnique({
      where: { id },
      include: { _count: { select: { imports: true } } },
    });
  }

  /**
   * Schemas selectable from one project: its own, plus every global one.
   * Archived schemas are excluded — the upload picker must not offer them, while
   * `findById` still returns them so an old import's details stay readable.
   */
  async listVisible(
    projectId: string,
    { skip, take }: ListImportSchemasParams,
  ): Promise<ListImportSchemasResult> {
    const where: Prisma.ImportSchemaWhereInput = {
      archivedAt: null,
      OR: [{ projectId }, { projectId: null }],
    };

    const [schemas, total] = await this.prisma.$transaction([
      this.prisma.importSchema.findMany({ where, skip, take, orderBy: { createdAt: "desc" } }),
      this.prisma.importSchema.count({ where }),
    ]);
    return { schemas, total };
  }

  /**
   * Finds a live GLOBAL schema by name.
   *
   * This exists because the `@@unique([projectId, name])` index cannot enforce
   * uniqueness among global schemas: their project_id is NULL, and SQL treats
   * every NULL as distinct from every other NULL, so two global schemas named
   * "customers" do not violate it. Verified — see docs/DATA_MODEL.md.
   */
  async findGlobalByName(name: string): Promise<ImportSchema | null> {
    return this.prisma.importSchema.findFirst({
      where: { projectId: null, name, archivedAt: null },
    });
  }

  async archive(id: string): Promise<ImportSchema> {
    try {
      return await this.prisma.importSchema.update({
        where: { id },
        data: { archivedAt: new Date() },
      });
    } catch (error) {
      throw toDomainError(error);
    }
  }
}

function toDomainError(error: unknown): unknown {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      return new ConflictError(IMPORT_SCHEMA_MESSAGES.NAME_TAKEN);
    }
    if (error.code === "P2003") {
      return new NotFoundError(IMPORT_SCHEMA_MESSAGES.NOT_FOUND);
    }
    if (error.code === "P2025") {
      return new NotFoundError(IMPORT_SCHEMA_MESSAGES.NOT_FOUND);
    }
  }
  return error;
}
