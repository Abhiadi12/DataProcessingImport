import { describe, expect, it } from "vitest";
import { formatDate } from "./format";

describe("formatDate", () => {
  // Midday UTC, so the calendar day is the same in every time zone the tests
  // might run in.
  it("formats an ISO timestamp as day, short month and year", () => {
    expect(formatDate("2026-09-01T12:00:00.000Z")).toMatch(/^01 Sep\w* 2026$/);
  });

  it("returns an empty string for an invalid date", () => {
    expect(formatDate("not-a-date")).toBe("");
  });
});
