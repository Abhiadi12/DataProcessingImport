import { Transform } from "node:stream";
import { ImportStage } from "@prisma/client";
import { parse } from "csv-parse";
import { container } from "../../container.js";
import {
  COUNTER_FLUSH_EVERY_BATCHES,
  HEADER_PROBE_BYTES,
  IMPORT_BATCH_SIZE,
  IMPORT_MESSAGES,
  STORAGE_KEYS,
} from "../../constants/index.js";
import { BadRequestError } from "../../errors/bad-request.error.js";
import { BaseError } from "../../errors/base.error.js";
import { NotFoundError } from "../../errors/not-found.error.js";
import type { ImportProgress } from "../../repositories/v1/import.repository.js";
import type { ImportRecordRow } from "../../repositories/v1/import-record.repository.js";
import { compileSchema, type CompiledSchema } from "../../services/v1/schema-compiler.service.js";
import type { FieldsDefinition } from "../../services/v1/import-schema.definition.js";
import { logger } from "../../utils/logger.js";
import type { ImportJobMessage } from "../../queue/import-publisher.js";
import { ErrorReportWriter } from "./error-report.js";

/**
 * Counts bytes as they flow past, without holding them.
 *
 * This is the simplest useful stream: a Transform that passes every chunk
 * through untouched and only adds up their sizes. It sits BEFORE the CSV parser,
 * so it measures raw file bytes — which is what progress is based on, since the
 * row count is unknowable until the file has been fully read.
 *
 * Deliberately a Transform rather than a `.on("data")` listener: attaching a
 * data listener switches a stream into flowing mode, which would push data
 * through as fast as it arrives and defeat the backpressure the rest of the
 * pipeline depends on.
 */
class ByteCounter extends Transform {
  bytes = 0;

  _transform(
    chunk: Buffer,
    _encoding: BufferEncoding,
    callback: (error?: Error | null, data?: Buffer) => void,
  ): void {
    this.bytes += chunk.length;
    callback(null, chunk);
  }
}

/**
 * Processes one import, end to end.
 *
 * Error contract with the consumer:
 *   - returning normally  -> the import reached a terminal state, ack
 *   - throwing            -> infrastructure failure, nack (retry/DLQ)
 *
 * So a BAD FILE is caught here and recorded as FAILED (retrying it would fail
 * identically), while a DB or storage outage is allowed to propagate. That
 * split is the `isOperational` flag doing the job CLAUDE.md describes.
 */
export async function processImport(job: ImportJobMessage): Promise<void> {
  const { importRepository, importSchemaRepository, importRecordRepository, storageService } =
    container;

  // At-least-once delivery means this may be a redelivery of an import already
  // running, or one cancelled while queued. The conditional claim is the guard.
  const claimed = await importRepository.claimForProcessing(job.importId);
  if (!claimed) {
    logger.info(
      { importId: job.importId, requestId: job.requestId },
      "Import not claimable (already owned, cancelled, or terminal) — dropping delivery",
    );
    return;
  }

  const log = logger.child({ importId: job.importId, requestId: job.requestId });

  const record = await importRepository.findById(job.importId);
  if (!record) throw new NotFoundError(IMPORT_MESSAGES.NOT_FOUND);

  const schema = await importSchemaRepository.findById(record.schemaId);
  if (!schema) throw new NotFoundError(IMPORT_MESSAGES.SCHEMA_NOT_FOUND);

  // ONCE per import. Everything after this is the hot loop.
  const compiled = compileSchema(schema.fields as FieldsDefinition);

  const errorReport = new ErrorReportWriter(
    storageService,
    importRecordRepository,
    record.id,
    STORAGE_KEYS.importErrorReport(record.projectId, record.id),
  );

  const progress: ImportProgress = {
    processed: 0,
    successful: 0,
    failed: 0,
    duplicates: 0,
    bytesRead: 0,
  };

  try {
    // ---- Stage 1: FILE_VALIDATION -------------------------------------------
    const object = await storageService.headObject(record.objectKey);
    if (!object.exists) throw new BadRequestError(IMPORT_MESSAGES.OBJECT_VANISHED);
    if (object.size === 0) throw new BadRequestError(IMPORT_MESSAGES.FILE_EMPTY);

    // ---- Stage 2: SCHEMA_VALIDATION -----------------------------------------
    // A ranged read of the first 64KB, so a file missing a required column
    // fails in milliseconds instead of after streaming 2GB.
    await importRepository.setStage(record.id, ImportStage.SCHEMA_VALIDATION);
    await validateHeader(record.objectKey, compiled);

    // ---- Stage 3: IMPORTING -------------------------------------------------
    await importRepository.setStage(record.id, ImportStage.IMPORTING);

    const source = await storageService.getObjectStream(record.objectKey);
    const counter = new ByteCounter();

    // Three streams composed into a pipeline. Each stage pulls from the one
    // before it, so nothing is read until the stage downstream is ready:
    //
    //   S3 socket  ->  ByteCounter  ->  csv-parse  ->  (this for-await loop)
    //
    // csv-parse is what makes chunk boundaries a non-issue: a row split across
    // two 64KB chunks is reassembled internally. That is also exactly why
    // byte-offset resume was rejected as a retry strategy — a byte offset can
    // land mid-row.
    const parser = source.pipe(counter).pipe(
      parse({
        columns: true, // first row becomes object keys
        bom: true, // strip a UTF-8 BOM (Excel exports have one)
        skip_empty_lines: true,
        trim: false, // we trim per field, after knowing the schema
        relax_column_count: true, // a short/long row is a row error, not a file error
      }),
    );

    let batch: ImportRecordRow[] = [];
    let batchesSinceFlush = 0;
    let rowNumber = 0;

    const flushBatch = async (): Promise<void> => {
      if (batch.length > 0) {
        const result = await importRecordRepository.insertRecords(batch);
        progress.successful += result.inserted;
        // Free for the unique index: rows attempted minus rows that landed.
        progress.duplicates += result.duplicates;
        batch = [];
      }

      await errorReport.flushSample();

      batchesSinceFlush += 1;
      if (batchesSinceFlush >= COUNTER_FLUSH_EVERY_BATCHES) {
        batchesSinceFlush = 0;
        progress.bytesRead = counter.bytes;
        await importRepository.updateProgress(record.id, progress);
      }
    };

    // `for await` is the backpressure mechanism, and it is the single most
    // important line in this file.
    //
    // The loop body is async, so while we are inserting a batch the parser is
    // not being read, which means ByteCounter is not being read, which means the
    // S3 socket stops being drained. The whole pipeline idles at the speed of
    // the slowest stage — in our case Postgres. Replace this with
    // `.on("data", ...)` and rows would arrive faster than they can be inserted,
    // the queue of pending rows would grow without bound, and the process would
    // run out of memory on a large file: a "streaming" import that is not
    // actually streaming.
    for await (const raw of parser as AsyncIterable<Record<string, string | undefined>>) {
      rowNumber += 1;
      progress.processed += 1;

      const result = compiled.processRow(raw);

      if (!result.ok) {
        progress.failed += 1;
        await errorReport.addRow(rowNumber, rebuildRawRow(raw), result.errors);
      } else {
        batch.push({
          projectId: record.projectId,
          schemaId: record.schemaId,
          importId: record.id,
          data: result.data as ImportRecordRow["data"],
          dedupeHash: result.dedupeHash,
        });
      }

      if (batch.length >= IMPORT_BATCH_SIZE) {
        await flushBatch();
      }
    }

    // Whatever is left over after the last full batch.
    await flushBatch();
    progress.bytesRead = counter.bytes;

    // ---- Stage 4: REPORT_GENERATION ----------------------------------------
    await importRepository.setStage(record.id, ImportStage.REPORT_GENERATION);
    const errorReportKey = await errorReport.finish();

    // The identity that must always hold. Logged rather than thrown so a
    // counting bug is visible without destroying an otherwise good import.
    if (progress.processed !== progress.successful + progress.failed + progress.duplicates) {
      log.error(
        { progress },
        "Counter identity violated: processed != successful+failed+duplicates",
      );
    }

    await importRepository.markCompleted(record.id, progress, errorReportKey);
    log.info({ ...progress, errorReportKey }, "Import completed");
  } catch (error) {
    await errorReport.destroy();

    // Operational = the file or its content is wrong. Retrying cannot help, so
    // the import is recorded as FAILED and the delivery is acked by returning.
    if (error instanceof BaseError && error.isOperational) {
      await importRepository.markFailed(record.id, error.message);
      log.warn({ err: error, stage: "validation" }, "Import failed (not retryable)");
      return;
    }

    // Anything else is infrastructure. Rethrow so the consumer nacks it and the
    // retry/DLQ machinery takes over.
    log.error({ err: error }, "Import failed with an infrastructure error");
    throw error;
  }
}

/**
 * Reads only the first chunk of the file and checks the header row.
 *
 * The final line of a ranged read is almost always cut mid-row, so it is
 * discarded — we only need line one. Parsing the truncated tail would invent
 * phantom errors.
 */
async function validateHeader(objectKey: string, compiled: CompiledSchema): Promise<void> {
  const { storageService } = container;
  const head = await storageService.getObjectRange(objectKey, HEADER_PROBE_BYTES);

  const firstLineEnd = head.indexOf("\n");
  const headerLine = (firstLineEnd === -1 ? head : head.slice(0, firstLineEnd)).trim();
  if (headerLine === "") throw new BadRequestError(IMPORT_MESSAGES.NO_HEADER_ROW);

  const columns = headerLine
    .replace(/^/, "") // BOM, if the file has one
    .split(",")
    .map((name) => name.trim().replace(/^"|"$/g, ""));

  const missing = compiled.requiredFields.filter((field) => !columns.includes(field));
  if (missing.length > 0) {
    throw new BadRequestError(IMPORT_MESSAGES.missingColumns(missing));
  }
}

/**
 * Reconstructs a CSV line for the error report.
 *
 * csv-parse hands us a parsed object, not the original text, and keeping the
 * raw line alongside every row would mean holding two copies of the file's
 * worth of strings. Re-joining the values is close enough for a diagnostic and
 * costs nothing for valid rows, which never reach here.
 */
function rebuildRawRow(raw: Record<string, string | undefined>): string {
  return Object.values(raw)
    .map((value) => value ?? "")
    .join(",");
}
