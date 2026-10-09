import { ImportStage, ImportStatus, Prisma, type Import, type PrismaClient } from "@prisma/client";
import { IMPORT_MESSAGES } from "../../constants/index.js";
import { NotFoundError } from "../../errors/not-found.error.js";

export interface CreateImportData {
  id: string;
  projectId: string;
  schemaId: string;
  uploadedById: string;
  filename: string;
  objectKey: string;
  sizeBytes: number;
  contentType: string;
}

export interface ImportProgress {
  processed: number;
  successful: number;
  failed: number;
  duplicates: number;
  bytesRead: number;
}

export interface ListImportsParams {
  skip: number;
  take: number;
  status?: ImportStatus;
}

/** Import rows joined with the display names the UI needs. */
export interface ImportWithRelations extends Import {
  schema: { name: string };
  uploadedBy: { name: string };
}

export interface ListImportsResult {
  imports: ImportWithRelations[];
  total: number;
}

export class ImportRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(data: CreateImportData): Promise<Import> {
    try {
      return await this.prisma.import.create({
        data: { ...data, sizeBytes: BigInt(data.sizeBytes) },
      });
    } catch (error) {
      throw toDomainError(error);
    }
  }

  async findById(id: string): Promise<Import | null> {
    return this.prisma.import.findUnique({ where: { id } });
  }

  /**
   * UPLOADING -> QUEUED, conditionally.
   *
   * The `status` in the WHERE clause is the whole point: it makes the transition
   * atomic, so two concurrent `start` calls cannot both succeed. The loser sees
   * `count === 0` and is told the import has already been started, rather than a
   * second RabbitMQ message being published for the same import.
   *
   * Same pattern the worker will use to claim a job, and the same reason
   * `SELECT` then `UPDATE` would not do — both readers would see UPLOADING.
   */
  async markQueued(id: string): Promise<boolean> {
    const { count } = await this.prisma.import.updateMany({
      where: { id, status: ImportStatus.UPLOADING },
      data: { status: ImportStatus.QUEUED, queuedAt: new Date() },
    });
    return count === 1;
  }

  /**
   * Undo markQueued when publishing the job failed.
   *
   * Without this, a broker outage between the UPDATE and the publish would
   * leave the row at QUEUED with no message in existence — permanently stuck,
   * because `start()` refuses to run again on a non-UPLOADING import. Reverting
   * makes the whole operation retryable.
   */
  async revertToUploading(id: string): Promise<void> {
    await this.prisma.import.updateMany({
      where: { id, status: ImportStatus.QUEUED },
      data: { status: ImportStatus.UPLOADING, queuedAt: null },
    });
  }

  /**
   * QUEUED -> PROCESSING, conditionally. The worker's claim.
   *
   * RabbitMQ guarantees at-least-once delivery, so the same message WILL
   * sometimes arrive twice (a redelivery after a worker died, for instance).
   * Returning false here means someone else owns this import, or it was
   * cancelled while queued — either way the delivery should be acked and
   * dropped rather than processed.
   *
   * Must be a conditional UPDATE, not SELECT-then-UPDATE: two workers reading
   * the status simultaneously would both see QUEUED and both proceed.
   */
  async setStage(id: string, stage: ImportStage): Promise<void> {
    await this.prisma.import.update({ where: { id }, data: { stage } });
  }

  /**
   * Periodic counter write during a long import.
   *
   * Absolute values, not increments: the worker holds the running totals in
   * memory and writes the current state, so a missed flush self-corrects on the
   * next one instead of permanently skewing the numbers.
   */
  async updateProgress(id: string, progress: ImportProgress): Promise<void> {
    await this.prisma.import.update({
      where: { id },
      data: {
        processedRows: progress.processed,
        successfulRows: progress.successful,
        failedRows: progress.failed,
        duplicateRows: progress.duplicates,
        bytesRead: BigInt(progress.bytesRead),
      },
    });
  }

  async markCompleted(
    id: string,
    progress: ImportProgress,
    errorReportKey: string | null,
  ): Promise<void> {
    await this.prisma.import.update({
      where: { id },
      data: {
        status: ImportStatus.COMPLETED,
        stage: ImportStage.REPORT_GENERATION,
        totalRows: progress.processed,
        processedRows: progress.processed,
        successfulRows: progress.successful,
        failedRows: progress.failed,
        duplicateRows: progress.duplicates,
        bytesRead: BigInt(progress.bytesRead),
        errorReportKey,
        completedAt: new Date(),
      },
    });
  }

  /** Terminal cancel, keeping whatever counters the attempt reached. */
  async markCancelled(
    id: string,
    progress: ImportProgress,
    errorReportKey: string | null,
  ): Promise<void> {
    await this.prisma.import.update({
      where: { id },
      data: {
        status: ImportStatus.CANCELLED,
        processedRows: progress.processed,
        successfulRows: progress.successful,
        failedRows: progress.failed,
        duplicateRows: progress.duplicates,
        bytesRead: BigInt(progress.bytesRead),
        errorReportKey,
        completedAt: new Date(),
      },
    });
  }

  /**
   * Cancel an import no worker has claimed yet: one still awaiting its upload
   * (UPLOADING) or waiting in the queue (QUEUED).
   *
   * Conditional on those two statuses so it cannot race the transition out of
   * them — `markQueued` moving UPLOADING on, or a worker claiming QUEUED — and
   * exactly one side wins. For a QUEUED row the queue MESSAGE is deliberately
   * left in place: RabbitMQ has no "delete one message" operation, so this row
   * acts as a tombstone and the worker's claim will refuse it and ack.
   *
   * UPLOADING used to be left out, so cancelling an upload that was never
   * started answered 202 and changed nothing — the row stayed UPLOADING (and
   * counted as an active import) forever.
   */
  async cancelUnclaimed(id: string): Promise<boolean> {
    const { count } = await this.prisma.import.updateMany({
      where: { id, status: { in: [ImportStatus.UPLOADING, ImportStatus.QUEUED] } },
      data: { status: ImportStatus.CANCELLED, completedAt: new Date() },
    });
    return count === 1;
  }

  /** Paginated history for one project, newest first, optionally filtered by status. */
  async listForProject(
    projectId: string,
    { skip, take, status }: ListImportsParams,
  ): Promise<ListImportsResult> {
    const where = { projectId, ...(status === undefined ? {} : { status }) };
    const [imports, total] = await this.prisma.$transaction([
      this.prisma.import.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        include: { schema: { select: { name: true } }, uploadedBy: { select: { name: true } } },
      }),
      this.prisma.import.count({ where }),
    ]);
    return { imports, total };
  }

  /** One import plus the display names the UI needs, in a single query. */
  async findDetailById(id: string): Promise<ImportWithRelations | null> {
    return this.prisma.import.findUnique({
      where: { id },
      include: { schema: { select: { name: true } }, uploadedBy: { select: { name: true } } },
    });
  }

  async markFailed(id: string, reason: string): Promise<void> {
    await this.prisma.import.update({
      where: { id },
      data: { status: ImportStatus.FAILED, failureReason: reason, completedAt: new Date() },
    });
  }

  /**
   * PROCESSING -> QUEUED after a failed attempt whose retry has been scheduled.
   *
   * Without this the row would sit at PROCESSING with no worker owning it, and
   * the eventual redelivery would fail the conditional claim and be dropped.
   */
  async requeueForRetry(id: string, attempt: number): Promise<void> {
    await this.prisma.import.update({
      where: { id },
      // `attempt` is recorded here as well as carried on the message. The
      // message is the source of truth for routing, but without writing it back
      // the row would say attempt=0 after three automatic retries — so the
      // details page and the DLQ investigation would both lie about what
      // happened.
      data: { status: ImportStatus.QUEUED, stage: null, attempt, queuedAt: new Date() },
    });
  }

  /**
   * Full reset for a MANUAL retry, in one statement.
   *
   * Counters go back to zero and `attempt` increments. The caller must also
   * delete this import's rows from imported_records and import_errors first —
   * otherwise every re-run reports successful=0 with everything counted as a
   * duplicate of its own previous attempt, which is true but useless.
   * See docs/IDEMPOTENCY.md.
   */
  /** Persist the attempt number reached, so a dead-lettered import says so. */
  async recordAttempt(id: string, attempt: number): Promise<void> {
    await this.prisma.import.update({ where: { id }, data: { attempt } });
  }

  async resetForRetry(id: string): Promise<Import> {
    return this.prisma.import.update({
      where: { id },
      data: {
        status: ImportStatus.QUEUED,
        stage: null,
        attempt: { increment: 1 },
        failureReason: null,
        totalRows: null,
        processedRows: 0,
        successfulRows: 0,
        failedRows: 0,
        duplicateRows: 0,
        bytesRead: BigInt(0),
        errorReportKey: null,
        queuedAt: new Date(),
        startedAt: null,
        completedAt: null,
      },
    });
  }

  async claimForProcessing(id: string): Promise<boolean> {
    const { count } = await this.prisma.import.updateMany({
      where: { id, status: ImportStatus.QUEUED },
      data: {
        status: ImportStatus.PROCESSING,
        stage: ImportStage.FILE_VALIDATION,
        startedAt: new Date(),
      },
    });
    return count === 1;
  }
}

function toDomainError(error: unknown): unknown {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    // P2003 = foreign key violation: the project, schema or uploader is gone.
    if (error.code === "P2003") {
      return new NotFoundError(IMPORT_MESSAGES.NOT_FOUND);
    }
    // P2025 = the row to update doesn't exist.
    if (error.code === "P2025") {
      return new NotFoundError(IMPORT_MESSAGES.NOT_FOUND);
    }
  }
  return error;
}
