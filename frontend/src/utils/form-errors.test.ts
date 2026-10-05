import { AxiosError, AxiosHeaders, type AxiosResponse } from "axios";
import { describe, expect, it, vi } from "vitest";
import { COMMON_MESSAGES } from "@/constants";
import type { LoginInput } from "@/types";
import { applyServerErrors } from "./form-errors";

function axiosErrorWithBody(data: unknown): AxiosError {
  const config = { headers: new AxiosHeaders() };
  const response: AxiosResponse = {
    data,
    status: 400,
    statusText: "Bad Request",
    headers: {},
    config,
  };
  return new AxiosError("Request failed", "ERR_BAD_REQUEST", config, undefined, response);
}

const fields = ["email", "password"] as const;

describe("applyServerErrors", () => {
  it("puts a field error under the matching field", () => {
    const setError = vi.fn();
    const error = axiosErrorWithBody({
      message: "Invalid request body",
      error: { code: "BadRequestError", details: { fieldErrors: { email: ["Invalid email"] } } },
    });

    applyServerErrors<LoginInput>(error, setError, fields);

    expect(setError).toHaveBeenCalledTimes(1);
    expect(setError).toHaveBeenCalledWith("email", { type: "server", message: "Invalid email" });
  });

  it("uses the response message as the form error when there are no field errors", () => {
    const setError = vi.fn();
    const error = axiosErrorWithBody({
      message: "Invalid email or password",
      error: { code: "UnauthorizedError" },
    });

    applyServerErrors<LoginInput>(error, setError, fields);

    expect(setError).toHaveBeenCalledWith("root", {
      type: "server",
      message: "Invalid email or password",
    });
  });

  it("falls back to the form error for a field the form does not have", () => {
    const setError = vi.fn();
    const error = axiosErrorWithBody({
      message: "Invalid request body",
      error: { code: "BadRequestError", details: { fieldErrors: { role: ["Not allowed"] } } },
    });

    applyServerErrors<LoginInput>(error, setError, fields);

    expect(setError).toHaveBeenCalledWith("root", {
      type: "server",
      message: "Invalid request body",
    });
  });

  it("uses the generic message for a non-API error", () => {
    const setError = vi.fn();

    applyServerErrors<LoginInput>(new Error("boom"), setError, fields);

    expect(setError).toHaveBeenCalledWith("root", {
      type: "server",
      message: COMMON_MESSAGES.UNKNOWN_ERROR,
    });
  });
});
