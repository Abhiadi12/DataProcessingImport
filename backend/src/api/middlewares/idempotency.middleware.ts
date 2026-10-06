import { createHash } from "node:crypto";
import { IdempotencyStatus } from "@prisma/client";
import type { NextFunction, Request, Response } from "express";
import {
  AUTH_MESSAGES,
  IDEMPOTENCY_HEADER,
  IDEMPOTENCY_KEY_MAX_LENGTH,
  IDEMPOTENCY_MESSAGES,
  IDEMPOTENCY_STALE_AFTER_MS,
  IDEMPOTENCY_TTL_MS,
  IDEMPOTENCY_REPLAY_HEADER,
} from "../../constants/index.js";
import { container } from "../../container.js";
import { ConflictError } from "../../errors/conflict.error.js";
import { UnauthorizedError } from "../../errors/unauthorized.error.js";
import { UnprocessableError } from "../../errors/unprocessable.error.js";
import { logger } from "../../utils/logger.js";

function canonicalise(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalise);
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, nested]) => [key, canonicalise(nested)]),
    );
  }
  return value;
}

function hashBody(body: unknown): string {
  return createHash("sha256")
    .update(JSON.stringify(canonicalise(body) ?? null), "utf8")
    .digest("hex");
}

export function idempotency(endpoint: string) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const rawKey = req.header(IDEMPOTENCY_HEADER);
    if (!rawKey) {
      next();
      return;
    }

    try {
      if (!req.user) throw new UnauthorizedError(AUTH_MESSAGES.NOT_AUTHENTICATED);

      const key = rawKey.trim().slice(0, IDEMPOTENCY_KEY_MAX_LENGTH);
      const requestHash = hashBody(req.body);
      const userId = req.user.id;
      const input = {
        key,
        userId,
        endpoint,
        requestHash,
        expiresAt: new Date(Date.now() + IDEMPOTENCY_TTL_MS),
      };

      const { idempotencyRepository } = container;
      let owned = await idempotencyRepository.claim(input);
      let existing = owned ? null : await idempotencyRepository.find(userId, endpoint, key);

      if (!owned && existing && existing.status === IdempotencyStatus.IN_PROGRESS) {
        const staleBefore = new Date(Date.now() - IDEMPOTENCY_STALE_AFTER_MS);
        if (existing.createdAt < staleBefore) {
          owned = await idempotencyRepository.reclaimIfStale(existing.id, staleBefore, input);
          if (owned) existing = null;
        }
      }

      if (!owned && existing) {
        if (existing.requestHash !== requestHash) {
          throw new UnprocessableError(IDEMPOTENCY_MESSAGES.KEY_REUSED);
        }

        if (existing.status === IdempotencyStatus.COMPLETED && existing.responseCode !== null) {
          logger.info({ key, endpoint, userId }, "Replaying idempotent response");
          res
            .status(existing.responseCode)
            .set(IDEMPOTENCY_REPLAY_HEADER, "true")
            .json(existing.responseBody);
          return;
        }

        throw new ConflictError(IDEMPOTENCY_MESSAGES.IN_FLIGHT);
      }

      const claimed = await idempotencyRepository.find(userId, endpoint, key);
      if (!claimed) {
        next();
        return;
      }

      const originalJson = res.json.bind(res);
      let recorded = false;

      res.json = (body: unknown): Response => {
        if (!recorded) {
          recorded = true;
          const status = res.statusCode;

          const persist =
            status >= 500
              ? idempotencyRepository.release(claimed.id)
              : idempotencyRepository.complete(claimed.id, status, body as never);

          void persist.catch((error: unknown) => {
            logger.error({ err: error, key, endpoint }, "Could not finalise idempotency key");
          });
        }
        return originalJson(body);
      };

      next();
    } catch (error) {
      next(error);
    }
  };
}
