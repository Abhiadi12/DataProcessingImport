import {
  connect,
  type ChannelModel,
  type ConfirmChannel,
  type RecoveringChannelModel,
} from "amqplib";
import { env } from "../config/env.js";
import { InternalError } from "../errors/internal.error.js";
import { logger } from "../utils/logger.js";
import { assertTopology } from "./topology.js";

/**
 * INFO: Called every time a channel becomes available — on first connect AND after
 * each recovery. The worker uses it to re-register its consumer, which would
 * otherwise be silently lost when the broker restarts.
 */
export type ChannelReadyHandler = (channel: ConfirmChannel) => Promise<void>;

function redactCredentials(url: string): string {
  try {
    const parsed = new URL(url);
    return `${parsed.protocol}//${parsed.username ? "***:***@" : ""}${parsed.host}`;
  } catch {
    return "amqp://<unparseable>";
  }
}

export class QueueConnection {
  private model: RecoveringChannelModel | null = null;
  private channel: ConfirmChannel | null = null;
  private readonly readyHandlers: ChannelReadyHandler[] = [];

  onChannelReady(handler: ChannelReadyHandler): void {
    this.readyHandlers.push(handler);
  }

  async connect(): Promise<void> {
    this.model = await connect(env.RABBITMQ_URL, {
      recovery: {
        initialMaxRetries: 5,
        setup: async (model: ChannelModel) => {
          const channel = await model.createConfirmChannel();
          await assertTopology(channel);
          this.channel = channel;

          channel.on("error", (error: unknown) => {
            logger.error({ err: error }, "AMQP channel error");
          });

          for (const handler of this.readyHandlers) {
            await handler(channel);
          }
        },
      },
    });

    this.model.on("disconnect", (error) => {
      this.channel = null;
      logger.warn({ err: error }, "AMQP disconnected, recovery will retry");
    });
    this.model.on("reconnect-scheduled", ({ attempt, delay }) => {
      logger.warn({ attempt, delayMs: delay }, "AMQP reconnect scheduled");
    });
    this.model.on("connect", () => {
      logger.info("AMQP reconnected");
    });
    logger.info({ url: redactCredentials(env.RABBITMQ_URL) }, "AMQP connected");
    this.model.on("reconnect-failed", (error) => {
      logger.fatal({ err: error }, "AMQP recovery gave up");
      process.exit(1);
    });
    this.model.on("error", (error) => {
      logger.error({ err: error }, "AMQP connection error");
    });
  }

  getChannel(): ConfirmChannel {
    if (!this.channel) {
      throw new InternalError("Message broker is not connected");
    }
    return this.channel;
  }

  async close(): Promise<void> {
    this.channel = null;
    await this.model?.close();
    this.model = null;
  }
}
