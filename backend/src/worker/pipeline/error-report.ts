import { PassThrough } from "node:stream";
import { IMPORT_ERROR_SAMPLE_LIMIT } from "../../constants/index.js";
import type { ImportRecordRepository } from "../../repositories/v1/import-record.repository.js";
import type { StorageService } from "../../services/v1/storage.service.js";
import type { FieldError } from "../../services/v1/schema-compiler.service.js";

/** RFC 4180: wrap in quotes and double any embedded quote. */
function csvCell(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

/**
 * Writes the error CSV to object storage AS ERRORS ARE FOUND, and keeps a
 * capped sample in Postgres.
 *
 * The streaming matters: a 5M-row file where every row is invalid produces 5M
 * error rows. Collecting those in an array to upload at the end would use more
 * memory than the import we are trying to avoid loading. Instead a PassThrough
 * is handed to the S3 multipart uploader, which drains it into 5MB parts while
 * we keep writing.
 *
 * Two outputs, deliberately different:
 *   - the CSV in storage is COMPLETE (every bad row)
 *   - `import_errors` holds only the first IMPORT_ERROR_SAMPLE_LIMIT rows, so
 *     the details page can show "first 20 errors" without downloading the CSV
 *
 * `failedRows` stays exact either way, because it is a counter rather than a
 * row count.
 */
export class ErrorReportWriter {
  private readonly body = new PassThrough();
  private readonly uploadPromise: Promise<void>;
  private readonly pendingDbRows: { rowNumber: number; rawRow: string; errors: FieldError[] }[] =
    [];
  private sampleStored = 0;
  private wroteAnyRow = false;
  private finished = false;

  constructor(
    private readonly storage: StorageService,
    private readonly records: ImportRecordRepository,
    private readonly importId: string,
    readonly objectKey: string,
  ) {
    // Starts immediately and runs CONCURRENTLY with the import loop: the
    // uploader consumes `body` while the pipeline writes to it. Nothing is
    // awaited until finish(), so writing an error row costs almost nothing.
    this.uploadPromise = this.storage.uploadStream(objectKey, this.body, "text/csv");
    this.body.write("row_number,field,message,raw_row\n");
  }

  /**
   * Records one invalid row. Returns once the CSV line is buffered — NOT once
   * it has reached storage.
   *
   * The `await` on `body.write()` returning false is what applies
   * backpressure: if the uploader is slower than the pipeline, the pipeline
   * pauses instead of growing the buffer without bound.
   */
  async addRow(rowNumber: number, rawRow: string, errors: FieldError[]): Promise<void> {
    this.wroteAnyRow = true;

    for (const error of errors) {
      const line = [
        String(rowNumber),
        csvCell(error.field),
        csvCell(error.message),
        csvCell(rawRow),
      ].join(",");

      if (!this.body.write(`${line}\n`)) {
        // Buffer is full: wait for the uploader to drain before writing more.
        await new Promise<void>((resolve) => this.body.once("drain", resolve));
      }
    }

    if (this.sampleStored < IMPORT_ERROR_SAMPLE_LIMIT) {
      this.sampleStored += 1;
      this.pendingDbRows.push({ rowNumber, rawRow, errors });
    }
  }

  /** Flush the capped Postgres sample. Called per batch so it is never one huge insert. */
  async flushSample(): Promise<void> {
    if (this.pendingDbRows.length === 0) return;
    const rows = this.pendingDbRows.splice(0, this.pendingDbRows.length);
    await this.records.insertErrors(this.importId, rows);
  }

  /**
   * Closes the stream and waits for the multipart upload to complete.
   *
   * Returns the object key when at least one error was written, or null when
   * the import was clean — so `imports.error_report_key` stays null rather than
   * pointing at a header-only file the user would download for nothing.
   */
  async finish(): Promise<string | null> {
    if (this.finished) return this.wroteAnyRow ? this.objectKey : null;
    this.finished = true;

    await this.flushSample();
    // `end()` is what tells the uploader there are no more parts; without it
    // upload.done() would never resolve and the worker would hang forever.
    this.body.end();
    await this.uploadPromise;

    return this.wroteAnyRow ? this.objectKey : null;
  }

  /** Abort path: tear the stream down so the upload doesn't leak on failure. */
  async destroy(): Promise<void> {
    if (this.finished) return;
    this.finished = true;
    this.body.destroy();
    // The upload rejects once its source is destroyed; that is expected here.
    await this.uploadPromise.catch(() => undefined);
  }
}
