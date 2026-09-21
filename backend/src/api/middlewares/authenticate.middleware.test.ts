import type { NextFunction, Request, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { UnauthorizedError } from "../../errors/unauthorized.error.js";
import { authenticate } from "./authenticate.middleware.js";

const authService = vi.hoisted(() => ({ authenticate: vi.fn() }));
vi.mock("../../container.js", () => ({ container: { authService } }));

const res = {} as Response;

function requestWithAuthHeader(header?: string): Request {
  return { headers: header === undefined ? {} : { authorization: header } } as Request;
}

describe("authenticate middleware", () => {
  let next: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    next = vi.fn();
  });

  it("rejects a request with no Authorization header", async () => {
    await authenticate(requestWithAuthHeader(), res, next as NextFunction);

    expect(next.mock.calls[0]![0]).toBeInstanceOf(UnauthorizedError);
    expect(authService.authenticate).not.toHaveBeenCalled();
  });

  it("rejects a scheme other than Bearer", async () => {
    await authenticate(requestWithAuthHeader("Basic abc123"), res, next as NextFunction);

    expect(next.mock.calls[0]![0]).toBeInstanceOf(UnauthorizedError);
  });

  it('rejects "Bearer" with no token after it', async () => {
    await authenticate(requestWithAuthHeader("Bearer"), res, next as NextFunction);

    expect(next.mock.calls[0]![0]).toBeInstanceOf(UnauthorizedError);
  });

  it("sets req.user and continues for a valid token", async () => {
    authService.authenticate.mockResolvedValue({ id: "user-1", role: "MEMBER" });
    const req = requestWithAuthHeader("Bearer good-token");

    await authenticate(req, res, next as NextFunction);

    expect(authService.authenticate).toHaveBeenCalledWith("good-token");
    expect(req.user).toEqual({ id: "user-1", role: "MEMBER" });
    expect(next).toHaveBeenCalledWith();
  });

  it("passes the service's error to next() for a bad token", async () => {
    const error = new UnauthorizedError("Access token expired");
    authService.authenticate.mockRejectedValue(error);

    await authenticate(requestWithAuthHeader("Bearer expired-token"), res, next as NextFunction);

    expect(next).toHaveBeenCalledWith(error);
  });
});
