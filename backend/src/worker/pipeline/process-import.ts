import { container } from "../../container.js";
import { logger } from "../../utils/logger.js";
import type { ImportJobMessage } from "../../queue/import-publisher.js";

export async function processImport(job: ImportJobMessage): Promise<void> {
  const { importRepository } = container;

  const claimed = await importRepository.claimForProcessing(job.importId);
  if (!claimed) {
    logger.info(
      { importId: job.importId, requestId: job.requestId },
      "Import not claimable (already owned, cancelled, or terminal) — dropping delivery",
    );
    return;
  }

  const record = await importRepository.findById(job.importId);
  logger.info(
    {
      importId: job.importId,
      attempt: job.attempt,
      requestId: job.requestId,
      objectKey: record?.objectKey,
      sizeBytes: record ? Number(record.sizeBytes) : undefined,
    },
    "Import claimed — PIPELINE NOT IMPLEMENTED YET, leaving at PROCESSING",
  );
}
