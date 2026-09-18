import express from "express";
import { requestIdMiddleware } from "./middlewares/request-id.middleware.js";
import { errorHandlerMiddleware } from "./middlewares/error-handler.middleware.js";
import { NotFoundError } from "../errors/not-found.error.js";
import { ok } from "../utils/create-response.js";

export function createApp() {
  const app = express();

  app.use(express.json());
  app.use(requestIdMiddleware);

  app.get("/health", (_req, res) => {
    res.json(ok("ok", { uptime: process.uptime() }));
  });

  app.use((req, _res, next) => {
    next(new NotFoundError(`No route for ${req.method} ${req.path}`));
  });

  app.use(errorHandlerMiddleware);

  return app;
}
