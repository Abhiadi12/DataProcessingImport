import type { ConfirmChannel, ConsumeMessage } from "amqplib";
import { container } from "../container.js";
import {
  IMPORT_MESSAGES,
  MAX_IMPORT_ATTEMPTS,
  QUEUES,
  WORKER_PREFETCH,
} from "../constants/index.js";
import { BaseError } from "../errors/base.error.js";
import { parseImportJob, type ImportJobMessage } from "../queue/import-publisher.js";
import { logger } from "../utils/logger.js";
import { processImport } from "./pipeline/process-import.js";

export async function startImportConsumer(channel: ConfirmChannel): Promise<void> {
  await channel.prefetch(WORKER_PREFETCH);

  await channel.consume(
    QUEUES.PROCESS,
    (message) => {
      if (!message) {
        logger.warn("Import consumer cancelled by the broker");
        return;
      }

      const job = parseImportJob(message.content);
      if (!job) {
        logger.error(
          { raw: message.content.toString("utf8").slice(0, 200) },
          "Discarding malformed import job",
        );
        channel.nack(message, false, false);
        return;
      }

      void handleDelivery(channel, message, job);
    },
    { noAck: false },
  );

  logger.info({ queue: QUEUES.PROCESS, prefetch: WORKER_PREFETCH }, "Import consumer started");
}

async function handleDelivery(
  channel: ConfirmChannel,
  message: ConsumeMessage,
  job: ImportJobMessage,
): Promise<void> {
  try {
    await processImport(job);

    channel.ack(message);
    return;
  } catch (error) {
    await handleFailure(channel, message, job, error);
  }
}

async function handleFailure(
  channel: ConfirmChannel,
  message: ConsumeMessage,
  job: ImportJobMessage,
  error: unknown,
): Promise<void> {
  const { importRepository, importPublisher, importProgressService } = container;
  const log = logger.child({ importId: job.importId, requestId: job.requestId });
  const operational = error instanceof BaseError && error.isOperational;
  const reason = error instanceof Error ? error.message : String(error);

  if (operational || job.attempt >= MAX_IMPORT_ATTEMPTS) {
    const exhausted = !operational;
    log.error(
      { err: error, attempt: job.attempt, maxAttempts: MAX_IMPORT_ATTEMPTS, exhausted },
      exhausted
        ? "Import failed permanently — attempts exhausted"
        : "Import failed (not retryable)",
    );

    await safely(() => importRepository.recordAttempt(job.importId, job.attempt));
    await safely(() =>
      importRepository.markFailed(
        job.importId,
        exhausted ? IMPORT_MESSAGES.attemptsExhausted(job.attempt, reason) : reason,
      ),
    );
    await safely(() => importProgressService.clearCancel(job.importId));

    channel.nack(message, false, false);
    return;
  }

  const next: ImportJobMessage = { ...job, attempt: job.attempt + 1 };
  try {
    await importPublisher.publishRetry(next);

    await safely(() => importRepository.requeueForRetry(job.importId, next.attempt));

    log.warn(
      { err: error, attempt: job.attempt, nextAttempt: next.attempt },
      "Import failed, scheduled for retry",
    );

    channel.ack(message);
  } catch (publishError) {
    log.error({ err: publishError }, "Could not publish retry; requeuing delivery");
    channel.nack(message, false, true);
  }
}

async function safely(action: () => Promise<unknown>): Promise<void> {
  try {
    await action();
  } catch (error) {
    logger.error({ err: error }, "Post-failure bookkeeping failed");
  }
}
