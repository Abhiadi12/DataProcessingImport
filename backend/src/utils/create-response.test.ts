import { describe, expect, it } from "vitest";
import { createResponse, fail, ok } from "./create-response.js";

describe("response envelope", () => {
  it("ok() builds a success envelope with data and no error", () => {
    expect(ok("Fetched", { id: 1 })).toEqual({
      success: true,
      message: "Fetched",
      data: { id: 1 },
      error: null,
    });
  });

  it("ok() defaults data to null", () => {
    expect(ok("Done").data).toBeNull();
  });

  it("fail() builds a failure envelope with the error and no data", () => {
    expect(fail("Nope", { code: "NotFoundError" })).toEqual({
      success: false,
      message: "Nope",
      data: null,
      error: { code: "NotFoundError" },
    });
  });

  it("createResponse() defaults data and error to null", () => {
    expect(createResponse(true, "Hi")).toEqual({
      success: true,
      message: "Hi",
      data: null,
      error: null,
    });
  });
});
