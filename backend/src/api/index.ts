import { createApp } from "./app.js";
import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";
import { container } from "../container.js";

// ensureBucket lives here and not in createApp() on purpose: createApp() is what
// supertest builds in tests, and it must stay synchronous and network-free.
// Boot is also the right place to fail — an API that can't issue presigned URLs
// should refuse to start rather than accept traffic and 500 on every upload,
// the same reasoning as env.ts exiting on bad config.
async function bootstrap(): Promise<void> {
  await container.storageService.ensureBucket();
  await container.queueConnection.connect();

  const app = createApp();

  const server = app.listen(env.PORT, () => {
    logger.info({ port: env.PORT, bucket: env.S3_BUCKET }, "API server listening");
  });

  function shutdown(signal: string): void {
    logger.info({ signal }, "Shutting down API server");
    server.close(() => {
      void container.queueConnection
        .close()
        .catch((error: unknown) => logger.error({ err: error }, "Error closing AMQP"))
        .then(() => container.prisma.$disconnect())
        .then(() => {
          container.s3.destroy();
          process.exit(0);
        });
    });
  }

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

bootstrap().catch((error: unknown) => {
  logger.fatal({ err: error }, "API failed to start");
  process.exit(1);
});
