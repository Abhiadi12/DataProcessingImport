import { Prisma, type PrismaClient } from "@prisma/client";
import type { FieldError } from "../../services/v1/schema-compiler.service.js";

export interface ImportRecordRow {
  projectId: string;
  schemaId: string;
  importId: string;
  data: Prisma.InputJsonValue;
  dedupeHash: Uint8Array<ArrayBuffer>;
}

export interface ImportErrorRow {
  rowNumber: number;
  rawRow: string;
  errors: FieldError[];
}

export interface InsertRecordsResult {
  inserted: number;
  duplicates: number;
}

/** Guards against one pathological row blowing up the errors table. */
const RAW_ROW_MAX_LENGTH = 2000;

export class ImportRecordRepository {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * INFO: Batch insert with duplicates skipped.
   *
   * `skipDuplicates` compiles to `ON CONFLICT DO NOTHING` against
   * `(project_id, schema_id, dedupe_hash)`, which is what makes this both the
   * dedup mechanism AND retry idempotency — one index doing two jobs.
   *
   * The returned `count` is the number of rows that really landed, so
   * `attempted - count` is the duplicate count for free, with no extra query.
   *
   * Duplicates WITHIN one batch are handled too: the second copy conflicts with
   * the first, which the same statement just inserted.
   *
   */
  async insertRecords(rows: ImportRecordRow[]): Promise<InsertRecordsResult> {
    if (rows.length === 0) return { inserted: 0, duplicates: 0 };

    const { count } = await this.prisma.importRecord.createMany({
      data: rows,
      skipDuplicates: true,
    });

    return { inserted: count, duplicates: rows.length - count };
  }

  async insertErrors(importId: string, rows: ImportErrorRow[]): Promise<void> {
    if (rows.length === 0) return;

    await this.prisma.importError.createMany({
      data: rows.map((row) => ({
        importId,
        rowNumber: row.rowNumber,
        rawRow: row.rawRow.slice(0, RAW_ROW_MAX_LENGTH),
        errors: row.errors as unknown as Prisma.InputJsonValue,
      })),
    });
  }

  async listErrors(importId: string, take: number): Promise<ImportErrorRow[]> {
    const rows = await this.prisma.importError.findMany({
      where: { importId },
      orderBy: { rowNumber: "asc" },
      take,
    });

    return rows.map((row) => ({
      rowNumber: row.rowNumber,
      rawRow: row.rawRow,
      errors: row.errors as unknown as FieldError[],
    }));
  }

  async deleteByImport(importId: string): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.importRecord.deleteMany({ where: { importId } }),
      this.prisma.importError.deleteMany({ where: { importId } }),
    ]);
  }
}
