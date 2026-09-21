import type { NextFunction, Request, Response } from "express";
import { describe, expect, it, vi } from "vitest";
import { InternalError } from "../../errors/internal.error.js";
import { NotFoundError } from "../../errors/not-found.error.js";
import { errorHandlerMiddleware } from "./error-handler.middleware.js";

// INFO: vi.mock replaces the whole env module for this file only. Vitest moves this
// call above the imports, so the handler (and the logger it uses) load with
// NODE_ENV = "production" without the test process actually running in
// production.
vi.mock("../../config/env.js", () => ({
  env: { NODE_ENV: "production", LOG_LEVEL: "fatal" },
}));

function fakeResponse() {
  const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
  return res as typeof res & Response;
}

const req = { requestId: "test-request-id" } as Request;
const next = vi.fn() as NextFunction;

describe("errorHandlerMiddleware (production)", () => {
  it("still shows operational error messages, which are safe by definition", () => {
    const res = fakeResponse();

    errorHandlerMiddleware(new NotFoundError("User not found"), req, res, next);

    expect(res.json.mock.calls[0]![0].message).toBe("User not found");
  });

  it("hides a non-operational error's message", () => {
    const res = fakeResponse();

    errorHandlerMiddleware(
      new InternalError("connection to 10.0.0.5 failed for user admin"),
      req,
      res,
      next,
    );

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json.mock.calls[0]![0].message).toBe("Internal server error");
  });

  it("hides an unknown error's message", () => {
    const res = fakeResponse();

    errorHandlerMiddleware(new Error("database exploded"), req, res, next);

    expect(res.json.mock.calls[0]![0].message).toBe("Internal server error");
  });
});
