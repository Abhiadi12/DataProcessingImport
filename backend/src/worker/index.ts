import { container } from "../container.js";
import { logger } from "../utils/logger.js";
import { startImportConsumer } from "./consumer.js";

async function bootstrap(): Promise<void> {
  container.queueConnection.onChannelReady(startImportConsumer);
  await container.queueConnection.connect();

  logger.info("Import worker ready");

  let shuttingDown = false;
  const shutdown = (signal: string): void => {
    if (shuttingDown) return;
    shuttingDown = true;
    logger.info({ signal }, "Shutting down import worker");

    void container.queueConnection
      .close()
      .catch((error: unknown) => logger.error({ err: error }, "Error closing AMQP"))
      .then(() => container.prisma.$disconnect())
      .then(() => {
        container.s3.destroy();
        process.exit(0);
      });
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

bootstrap().catch((error: unknown) => {
  logger.fatal({ err: error }, "Import worker failed to start");
  process.exit(1);
});
