import type { ImportStage } from "@prisma/client";
import type { Redis } from "ioredis";
import {
  CANCEL_TTL_SECONDS,
  PROGRESS_FIELDS,
  PROGRESS_TTL_SECONDS,
  REDIS_KEYS,
} from "../../constants/index.js";
import { logger } from "../../utils/logger.js";

export interface ProgressDelta {
  processed: number;
  successful: number;
  failed: number;
  duplicates: number;
  /** ABSOLUTE, not a delta — the byte counter already holds a running total. */
  bytesRead: number;
}

export interface ProgressSnapshot {
  stage: ImportStage | null;
  bytesRead: number;
  processed: number;
  successful: number;
  failed: number;
  duplicates: number;
  updatedAt: number;
}

export class ImportProgressService {
  constructor(private readonly redis: Redis) {}

  async start(importId: string, stage: ImportStage): Promise<void> {
    const key = REDIS_KEYS.progress(importId);
    try {
      await this.redis
        .multi()
        .del(key)
        .hset(key, {
          [PROGRESS_FIELDS.STAGE]: stage,
          [PROGRESS_FIELDS.BYTES_READ]: 0,
          [PROGRESS_FIELDS.PROCESSED]: 0,
          [PROGRESS_FIELDS.SUCCESSFUL]: 0,
          [PROGRESS_FIELDS.FAILED]: 0,
          [PROGRESS_FIELDS.DUPLICATES]: 0,
          [PROGRESS_FIELDS.UPDATED_AT]: Date.now(),
        })
        .expire(key, PROGRESS_TTL_SECONDS)
        .exec();
    } catch (error) {
      logger.warn({ err: error, importId }, "Could not initialise Redis progress");
    }
  }

  async setStage(importId: string, stage: ImportStage): Promise<void> {
    const key = REDIS_KEYS.progress(importId);
    try {
      await this.redis.hset(
        key,
        PROGRESS_FIELDS.STAGE,
        stage,
        PROGRESS_FIELDS.UPDATED_AT,
        Date.now(),
      );
    } catch (error) {
      logger.warn({ err: error, importId }, "Could not update Redis stage");
    }
  }

  /**
   * ONE pipelined round trip per BATCH — never per row.
   *
   * Counters use HINCRBY (additive, so concurrent writes can't lose each other)
   * while bytesRead is HSET, because the byte counter already tracks a running
   * total and re-adding it would double-count.
   */
  async advance(importId: string, delta: ProgressDelta): Promise<void> {
    const key = REDIS_KEYS.progress(importId);
    try {
      await this.redis
        .pipeline()
        .hincrby(key, PROGRESS_FIELDS.PROCESSED, delta.processed)
        .hincrby(key, PROGRESS_FIELDS.SUCCESSFUL, delta.successful)
        .hincrby(key, PROGRESS_FIELDS.FAILED, delta.failed)
        .hincrby(key, PROGRESS_FIELDS.DUPLICATES, delta.duplicates)
        .hset(key, PROGRESS_FIELDS.BYTES_READ, delta.bytesRead)
        .hset(key, PROGRESS_FIELDS.UPDATED_AT, Date.now())
        .expire(key, PROGRESS_TTL_SECONDS)
        .exec();
    } catch (error) {
      logger.warn({ err: error, importId }, "Could not advance Redis progress");
    }
  }

  /** null when the key never existed or has expired — the caller falls back to Postgres. */
  async read(importId: string): Promise<ProgressSnapshot | null> {
    try {
      const hash = await this.redis.hgetall(REDIS_KEYS.progress(importId));
      if (Object.keys(hash).length === 0) return null;

      const toInt = (value: string | undefined): number => {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : 0;
      };

      return {
        stage: (hash[PROGRESS_FIELDS.STAGE] as ImportStage | undefined) ?? null,
        bytesRead: toInt(hash[PROGRESS_FIELDS.BYTES_READ]),
        processed: toInt(hash[PROGRESS_FIELDS.PROCESSED]),
        successful: toInt(hash[PROGRESS_FIELDS.SUCCESSFUL]),
        failed: toInt(hash[PROGRESS_FIELDS.FAILED]),
        duplicates: toInt(hash[PROGRESS_FIELDS.DUPLICATES]),
        updatedAt: toInt(hash[PROGRESS_FIELDS.UPDATED_AT]),
      };
    } catch (error) {
      logger.warn({ err: error, importId }, "Could not read Redis progress");
      return null;
    }
  }

  /**
   * Asks a running worker to stop.
   *
   * A flag rather than anything forceful: there is no way to interrupt a worker
   * mid-batch safely, so it polls this between batches and stops at a clean
   * boundary. Granularity is therefore one batch.
   */
  async requestCancel(importId: string): Promise<void> {
    await this.redis.set(REDIS_KEYS.cancel(importId), "1", "EX", CANCEL_TTL_SECONDS);
  }

  async isCancelRequested(importId: string): Promise<boolean> {
    try {
      return (await this.redis.get(REDIS_KEYS.cancel(importId))) !== null;
    } catch (error) {
      // Fail "not cancelled": a Redis blip must not abort a healthy import.
      logger.warn({ err: error, importId }, "Could not read cancel flag");
      return false;
    }
  }

  /** Clear the flag when an attempt ends, so a retry isn't cancelled on arrival. */
  async clearCancel(importId: string): Promise<void> {
    try {
      await this.redis.del(REDIS_KEYS.cancel(importId));
    } catch (error) {
      logger.warn({ err: error, importId }, "Could not clear cancel flag");
    }
  }
}
