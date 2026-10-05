import type { ConfirmChannel } from "amqplib";
import { QUEUES, WORKER_PREFETCH } from "../constants/index.js";
import { parseImportJob } from "../queue/import-publisher.js";
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
  message: Parameters<ConfirmChannel["ack"]>[0],
  job: ReturnType<typeof parseImportJob> & object,
): Promise<void> {
  try {
    await processImport(job);
    channel.ack(message);
  } catch (error) {
    logger.error(
      { err: error, importId: job.importId, attempt: job.attempt, requestId: job.requestId },
      "Import job failed",
    );

    channel.nack(message, false, false);
  }
}
