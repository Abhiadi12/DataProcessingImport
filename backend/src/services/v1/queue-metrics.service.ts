import { env } from "../../config/env.js";
import { QUEUES } from "../../constants/index.js";
import { logger } from "../../utils/logger.js";

export interface QueueMetrics {
  /** Messages waiting to be delivered. */
  queueSize: number;
  /** Messages delivered but not yet acked — i.e. imports being processed now. */
  inFlight: number;
  /** Live consumers on the process queue == running workers. */
  activeWorkers: number;
  retryQueueSize: number;
  deadLetterQueueSize: number;
  /** false when the broker's management API could not be reached. */
  available: boolean;
}

interface RabbitQueueResponse {
  messages_ready?: number;
  messages_unacknowledged?: number;
  consumers?: number;
}

const UNAVAILABLE: QueueMetrics = {
  queueSize: 0,
  inFlight: 0,
  activeWorkers: 0,
  retryQueueSize: 0,
  deadLetterQueueSize: 0,
  available: false,
};

export class QueueMetricsService {
  private readonly auth: string;

  constructor(
    private readonly managementUrl: string,
    username: string,
    password: string,
  ) {
    this.auth = `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`;
  }

  async read(): Promise<QueueMetrics> {
    try {
      const [process, retry, dlq] = await Promise.all([
        this.queue(QUEUES.PROCESS),
        this.queue(QUEUES.RETRY),
        this.queue(QUEUES.DLQ),
      ]);

      return {
        queueSize: process.messages_ready ?? 0,
        inFlight: process.messages_unacknowledged ?? 0,
        activeWorkers: process.consumers ?? 0,
        retryQueueSize: retry.messages_ready ?? 0,
        deadLetterQueueSize: dlq.messages_ready ?? 0,
        available: true,
      };
    } catch (error) {
      logger.warn({ err: error }, "Could not read RabbitMQ management metrics");
      return UNAVAILABLE;
    }
  }

  private async queue(name: string): Promise<RabbitQueueResponse> {
    const url = `${this.managementUrl}/api/queues/%2F/${encodeURIComponent(name)}`;

    const response = await fetch(url, {
      headers: { authorization: this.auth, accept: "application/json" },
      signal: AbortSignal.timeout(env.RABBITMQ_MANAGEMENT_TIMEOUT_MS),
    });

    if (!response.ok) {
      throw new Error(`RabbitMQ management API returned ${response.status} for ${name}`);
    }

    return (await response.json()) as RabbitQueueResponse;
  }
}
