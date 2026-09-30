import { AxiosError, AxiosHeaders, type AxiosResponse } from "axios";
import { describe, expect, it } from "vitest";
import { COMMON_MESSAGES } from "@/constants";
import { getApiErrorMessage } from "./api-error";

function axiosErrorWithResponse(data: unknown): AxiosError {
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

describe("getApiErrorMessage", () => {
  it("returns the backend's message from the response envelope", () => {
    const error = axiosErrorWithResponse({ success: false, message: "Email already registered" });

    expect(getApiErrorMessage(error)).toBe("Email already registered");
  });

  it("falls back to the generic message when the response has no message", () => {
    const error = axiosErrorWithResponse("");

    expect(getApiErrorMessage(error)).toBe(COMMON_MESSAGES.UNKNOWN_ERROR);
  });

  it("returns the network message when there is no response at all", () => {
    const error = new AxiosError("Network Error", "ERR_NETWORK");

    expect(getApiErrorMessage(error)).toBe(COMMON_MESSAGES.NETWORK_ERROR);
  });

  it("returns the generic message for errors that are not from axios", () => {
    expect(getApiErrorMessage(new Error("boom"))).toBe(COMMON_MESSAGES.UNKNOWN_ERROR);
    expect(getApiErrorMessage("a string")).toBe(COMMON_MESSAGES.UNKNOWN_ERROR);
  });
});
