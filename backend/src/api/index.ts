import { createApp } from "./app.js";
import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";
import { container } from "../container.js";

const app = createApp();

const server = app.listen(env.PORT, () => {
  logger.info({ port: env.PORT }, "API server listening");
});

function shutdown(signal: string): void {
  logger.info({ signal }, "Shutting down API server");
  server.close(() => {
    void container.prisma.$disconnect().then(() => process.exit(0));
  });
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
