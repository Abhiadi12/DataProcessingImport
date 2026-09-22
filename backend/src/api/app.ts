import express from "express";
import cookieParser from "cookie-parser";
import { requestIdMiddleware } from "./middlewares/request-id.middleware.js";
import { errorHandlerMiddleware } from "./middlewares/error-handler.middleware.js";
import { NotFoundError } from "../errors/not-found.error.js";
import { ok } from "../utils/create-response.js";
import { container } from "../container.js";
import { v1Router } from "./routes/v1/index.js";

export function createApp() {
  const app = express();

  app.use(express.json());
  app.use(cookieParser());
  app.use(requestIdMiddleware);

  app.get("/health", async (_req, res) => {
    await container.prisma.$queryRaw`SELECT 1`;
    res.json(ok("ok", { uptime: process.uptime(), database: "up" }));
  });

  app.use("/api/v1", v1Router);

  app.use((req, _res, next) => {
    next(new NotFoundError(`No route for ${req.method} ${req.path}`));
  });

  app.use(errorHandlerMiddleware);

  return app;
}
