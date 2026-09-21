import { beforeEach, describe, expect, it } from "vitest";
import { NotFoundError } from "../../errors/not-found.error.js";
import {
  asUserRepository,
  buildUser,
  createFakeUserRepository,
  type FakeUserRepository,
} from "../../testing/factories.js";
import { UserService } from "./user.service.js";

describe("UserService.getProfile", () => {
  let repo: FakeUserRepository;
  let service: UserService;

  beforeEach(() => {
    repo = createFakeUserRepository();
    service = new UserService(asUserRepository(repo));
  });

  it("returns the user's public profile", async () => {
    const user = buildUser();
    repo.findById.mockResolvedValue(user);

    const profile = await service.getProfile(user.id);

    expect(profile).toMatchObject({ id: user.id, email: user.email, name: user.name });
    expect(profile).not.toHaveProperty("passwordHash");
  });

  it("throws NotFoundError when the user doesn't exist", async () => {
    repo.findById.mockResolvedValue(null);

    await expect(service.getProfile("missing-id")).rejects.toThrow(NotFoundError);
  });
});
