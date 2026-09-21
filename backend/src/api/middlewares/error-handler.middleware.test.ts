import type { NextFunction, Request, Response } from "express";
import { describe, expect, it, vi } from "vitest";
import { BadRequestError } from "../../errors/bad-request.error.js";
import { InternalError } from "../../errors/internal.error.js";
import { NotFoundError } from "../../errors/not-found.error.js";
import { errorHandlerMiddleware } from "./error-handler.middleware.js";

function fakeResponse() {
  const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
  return res as typeof res & Response;
}

const req = { requestId: "test-request-id" } as Request;
const next = vi.fn() as NextFunction;

describe("errorHandlerMiddleware (non-production)", () => {
  it("sends an operational error's status, message and details", () => {
    const res = fakeResponse();
    const details = { fieldErrors: { email: ["Invalid email"] } };

    errorHandlerMiddleware(new BadRequestError("Invalid request body", details), req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Invalid request body",
      data: null,
      error: { code: "BadRequestError", details },
    });
  });

  it("uses the error class name as the error code", () => {
    const res = fakeResponse();

    errorHandlerMiddleware(new NotFoundError("User not found"), req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json.mock.calls[0]![0].error.code).toBe("NotFoundError");
  });

  it("never sends details for a non-operational error", () => {
    const res = fakeResponse();

    errorHandlerMiddleware(new InternalError("boom", { secret: "value" }), req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json.mock.calls[0]![0].error.details).toBeUndefined();
  });

  it("turns an unknown thrown value into a 500, showing it outside production", () => {
    const res = fakeResponse();

    errorHandlerMiddleware(new Error("database exploded"), req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json.mock.calls[0]![0]).toMatchObject({
      success: false,
      message: "Error: database exploded",
      error: { code: "InternalError" },
    });
  });
});
