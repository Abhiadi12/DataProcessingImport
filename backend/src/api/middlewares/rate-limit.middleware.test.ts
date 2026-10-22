import type { NextFunction, Request, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AUTH_MESSAGES, LOGIN_RATE_LIMIT } from "../../constants/index.js";
import { TooManyRequestsError } from "../../errors/too-many-requests.error.js";
import { mockLoginInput } from "../../testing/mockData/index.js";
import { loginRateLimit } from "./rate-limit.middleware.js";

const { rateLimitCheck, redis } = vi.hoisted(() => ({ rateLimitCheck: vi.fn(), redis: {} }));
vi.mock("../../utils/rate-limit.js", () => ({ rateLimitCheck }));
vi.mock("../../container.js", () => ({ container: { redis } }));

describe("loginRateLimit", () => {
  let next: ReturnType<typeof vi.fn>;
  let res: Response;
  const req = { body: mockLoginInput } as Request;

  beforeEach(() => {
    next = vi.fn();
    res = { setHeader: vi.fn() } as unknown as Response;
    rateLimitCheck.mockReset();
  });

  it("counts the attempt under the email and lets it through", async () => {
    rateLimitCheck.mockResolvedValue({ allowed: true, retryAfterSeconds: 600 });

    await loginRateLimit(req, res, next as NextFunction);

    expect(rateLimitCheck).toHaveBeenCalledWith(
      redis,
      `ratelimit:login:${mockLoginInput.email}`,
      LOGIN_RATE_LIMIT.limit,
      LOGIN_RATE_LIMIT.windowSeconds,
    );
    expect(next).toHaveBeenCalledWith();
  });

  it("rejects with 429 and Retry-After once over the limit", async () => {
    rateLimitCheck.mockResolvedValue({ allowed: false, retryAfterSeconds: 420 });

    await loginRateLimit(req, res, next as NextFunction);

    const error = next.mock.calls[0]![0] as TooManyRequestsError;
    expect(error).toBeInstanceOf(TooManyRequestsError);
    expect(error.message).toBe(AUTH_MESSAGES.TOO_MANY_LOGIN_ATTEMPTS);
    expect(error.details).toEqual({ retryAfterSeconds: 420 });
    expect(res.setHeader).toHaveBeenCalledWith("Retry-After", "420");
  });
});
