import type { NextFunction, Request, Response } from "express";
import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { BadRequestError } from "../../errors/bad-request.error.js";
import { validate } from "./validate.middleware.js";

const res = {} as Response;

describe("validate middleware", () => {
  it("replaces req.body with the parsed, transformed value and continues", () => {
    const req = { body: { email: "  JOHN@Example.com " } } as Request;
    const next = vi.fn() as NextFunction;

    validate({ body: z.object({ email: z.string().trim().toLowerCase() }) })(req, res, next);

    expect(req.body).toEqual({ email: "john@example.com" });
    expect(next).toHaveBeenCalledWith();
  });

  it("passes a BadRequestError with field details to next() on invalid body", () => {
    const req = { body: { age: "not-a-number" } } as Request;
    const next = vi.fn();

    validate({ body: z.object({ age: z.number() }) })(req, res, next);

    const error = next.mock.calls[0]![0];
    expect(error).toBeInstanceOf(BadRequestError);
    expect(error.details.fieldErrors).toHaveProperty("age");
  });

  // Express 5's req.query is a getter, so parsed values go on a separate field.
  it("puts parsed query parameters on req.validatedQuery", () => {
    const req = { query: { page: "2" } } as unknown as Request;
    const next = vi.fn() as NextFunction;

    validate({ query: z.object({ page: z.coerce.number() }) })(req, res, next);

    expect(req.validatedQuery).toEqual({ page: 2 });
  });

  it("puts parsed route params on req.validatedParams", () => {
    const req = { params: { id: "abc" } } as unknown as Request;
    const next = vi.fn() as NextFunction;

    validate({ params: z.object({ id: z.string() }) })(req, res, next);

    expect(req.validatedParams).toEqual({ id: "abc" });
  });

  it("rejects invalid query parameters", () => {
    const req = { query: { page: "abc" } } as unknown as Request;
    const next = vi.fn();

    validate({ query: z.object({ page: z.coerce.number() }) })(req, res, next);

    expect(next.mock.calls[0]![0].message).toBe("Invalid query parameters");
  });

  it("rejects invalid route params", () => {
    const req = { params: { id: "not-a-uuid" } } as unknown as Request;
    const next = vi.fn();

    validate({ params: z.object({ id: z.string().uuid() }) })(req, res, next);

    expect(next.mock.calls[0]![0].message).toBe("Invalid route parameters");
  });

  it("stops at the first invalid part and doesn't call next() twice", () => {
    const req = { body: {}, query: {} } as unknown as Request;
    const next = vi.fn();

    validate({
      body: z.object({ name: z.string() }),
      query: z.object({ page: z.string() }),
    })(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next.mock.calls[0]![0].message).toBe("Invalid request body");
  });
});
