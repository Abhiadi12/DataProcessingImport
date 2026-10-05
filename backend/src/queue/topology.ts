import type { Channel } from "amqplib";
import { EXCHANGES, QUEUES, RETRY_DELAY_MS, ROUTING_KEYS } from "../constants/index.js";
import { logger } from "../utils/logger.js";

/**
 * NOTE: asserting a queue whose arguments differ from the existing one fails
 * with PRECONDITION_FAILED. Changing a TTL or DLX here means deleting the queue
 * first — queue arguments are immutable once declared.
 */
export async function assertTopology(channel: Channel): Promise<void> {
  await channel.assertExchange(EXCHANGES.MAIN, "direct", { durable: true });
  await channel.assertExchange(EXCHANGES.DLX, "direct", { durable: true });

  await channel.assertQueue(QUEUES.PROCESS, {
    durable: true,
    deadLetterExchange: EXCHANGES.DLX,
    deadLetterRoutingKey: ROUTING_KEYS.PROCESS,
  });
  await channel.bindQueue(QUEUES.PROCESS, EXCHANGES.MAIN, ROUTING_KEYS.PROCESS);

  await channel.assertQueue(QUEUES.RETRY, {
    durable: true,
    messageTtl: RETRY_DELAY_MS,
    deadLetterExchange: EXCHANGES.MAIN,
    deadLetterRoutingKey: ROUTING_KEYS.PROCESS,
  });

  await channel.assertQueue(QUEUES.DLQ, { durable: true });
  await channel.bindQueue(QUEUES.DLQ, EXCHANGES.DLX, ROUTING_KEYS.PROCESS);

  logger.debug({ exchanges: EXCHANGES, queues: QUEUES }, "Queue topology asserted");
}
