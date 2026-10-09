import { EXCHANGES, QUEUES, ROUTING_KEYS } from "../constants/index.js";
import { InternalError } from "../errors/internal.error.js";
import { logger } from "../utils/logger.js";
import type { QueueConnection } from "./connection.js";

/**
 * INFO: The entire message body.
 *
 * ONE MESSAGE PER IMPORT, never per row: 10 rows is one message and 5,000,000
 * rows is still one message. The worker re-reads everything it needs from
 * Postgres and object storage using `importId`. Publishing per row would mean
 * five million messages for one file.
 */
export interface ImportJobMessage {
  importId: string;
  attempt: number;
  requestId: string;
}

export function parseImportJob(raw: Buffer): ImportJobMessage | null {
  try {
    const parsed: unknown = JSON.parse(raw.toString("utf8"));
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      typeof (parsed as ImportJobMessage).importId === "string" &&
      typeof (parsed as ImportJobMessage).attempt === "number"
    ) {
      const job = parsed as ImportJobMessage;
      return { importId: job.importId, attempt: job.attempt, requestId: job.requestId ?? "" };
    }
    return null;
  } catch {
    return null;
  }
}

export class ImportPublisher {
  constructor(private readonly connection: QueueConnection) {}

  publish(job: ImportJobMessage): Promise<void> {
    return this.send(EXCHANGES.MAIN, ROUTING_KEYS.PROCESS, job);
  }

  publishRetry(job: ImportJobMessage): Promise<void> {
    return this.send("", QUEUES.RETRY, job);
  }

  private send(exchange: string, routingKey: string, job: ImportJobMessage): Promise<void> {
    const channel = this.connection.getChannel();
    const body = Buffer.from(JSON.stringify(job), "utf8");

    return new Promise<void>((resolve, reject) => {
      const accepted = channel.publish(
        exchange,
        routingKey,
        body,
        {
          persistent: true,
          contentType: "application/json",
          messageId: job.importId,
          correlationId: job.requestId,
          timestamp: Date.now(),
        },
        (error: unknown) => {
          if (error) {
            reject(
              error instanceof Error ? error : new InternalError("Broker rejected the import job"),
            );
            return;
          }
          logger.info(
            { importId: job.importId, attempt: job.attempt, exchange, routingKey },
            "Import job published",
          );
          resolve();
        },
      );

      if (!accepted) {
        logger.warn({ importId: job.importId }, "AMQP write buffer full while publishing");
      }
    });
  }
}
