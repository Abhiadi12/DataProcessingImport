import type { NextFunction, Request, Response } from "express";
import { describe, expect, it, vi } from "vitest";
import { requestIdMiddleware } from "./request-id.middleware.js";

function fakeResponse() {
  const res = { setHeader: vi.fn() };
  return res as typeof res & Response;
}

describe("requestIdMiddleware", () => {
  it("reuses an incoming x-request-id so a request can be traced across services", () => {
    const req = { headers: { "x-request-id": "abc-123" } } as unknown as Request;
    const res = fakeResponse();
    const next = vi.fn() as NextFunction;

    requestIdMiddleware(req, res, next);

    expect(req.requestId).toBe("abc-123");
    expect(res.setHeader).toHaveBeenCalledWith("x-request-id", "abc-123");
    expect(next).toHaveBeenCalled();
  });

  it("generates a UUID when the client didn't send one", () => {
    const req = { headers: {} } as Request;
    const res = fakeResponse();

    requestIdMiddleware(req, res, vi.fn() as NextFunction);

    expect(req.requestId).toMatch(/^[0-9a-f-]{36}$/);
    expect(res.setHeader).toHaveBeenCalledWith("x-request-id", req.requestId);
  });
});
