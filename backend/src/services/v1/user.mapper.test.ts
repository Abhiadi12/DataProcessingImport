import { describe, expect, it } from "vitest";
import { buildUser } from "../../testing/factories.js";
import { toPublicUser } from "./user.mapper.js";

describe("toPublicUser", () => {
  it("removes passwordHash and keeps every other field", () => {
    const user = buildUser();

    const { passwordHash, ...expected } = user;

    expect(toPublicUser(user)).toEqual(expected);
    expect(passwordHash).toBeDefined();
  });
});
