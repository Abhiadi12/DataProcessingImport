import type { Redis } from "ioredis";
import { logger } from "./logger.js";

export async function rateLimitCheck(
  redis: Redis,
  key: string,
  limit: number,
  windowSeconds: number,
): Promise<{ allowed: boolean; retryAfterSeconds: number }> {
  try {
    const replies = await redis.multi().incr(key).expire(key, windowSeconds, "NX").ttl(key).exec();
    const count = Number(replies?.[0]?.[1]);
    const ttl = Number(replies?.[2]?.[1]);
    if (Number.isNaN(count)) throw new Error("Redis returned no count");

    return { allowed: count <= limit, retryAfterSeconds: ttl > 0 ? ttl : windowSeconds };
  } catch (error) {
    logger.warn({ err: error, key }, "Rate limit check failed; allowing request");
    return { allowed: true, retryAfterSeconds: 0 };
  }
}
