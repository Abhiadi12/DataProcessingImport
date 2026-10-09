import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { BadRequestError } from "../../errors/bad-request.error.js";
import { ConflictError } from "../../errors/conflict.error.js";
import { NotFoundError } from "../../errors/not-found.error.js";
import {
  asUserRepository,
  buildUser,
  createFakeUserRepository,
  type FakeUserRepository,
} from "../../testing/factories.js";
import {
  mockNewPassword,
  mockPassword,
  mockUserId,
  mockWrongPassword,
} from "../../testing/mockData/index.js";
import { hashPassword, verifyPassword } from "../../utils/password.js";
import { UserService } from "./user.service.js";

describe("UserService", () => {
  let repo: FakeUserRepository;
  let service: UserService;
  let passwordHash: string;

  // Hash once for the whole file: bcrypt is deliberately slow.
  beforeAll(async () => {
    passwordHash = await hashPassword(mockPassword);
  });

  beforeEach(() => {
    repo = createFakeUserRepository();
    service = new UserService(asUserRepository(repo));
  });

  describe("getProfile", () => {
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

  describe("updateProfile", () => {
    it("passes the provided fields to the repository for that user", async () => {
      repo.updateProfile.mockResolvedValue(buildUser({ name: "Johnny" }));

      await service.updateProfile(mockUserId, { name: "Johnny" });

      expect(repo.updateProfile).toHaveBeenCalledWith(mockUserId, { name: "Johnny" });
    });

    it("returns the updated public profile", async () => {
      repo.updateProfile.mockResolvedValue(buildUser({ email: "new@example.com" }));

      const profile = await service.updateProfile(mockUserId, { email: "new@example.com" });

      expect(profile.email).toBe("new@example.com");
      expect(profile).not.toHaveProperty("passwordHash");
    });

    it("lets a ConflictError through when the new email is taken", async () => {
      repo.updateProfile.mockRejectedValue(
        new ConflictError("An account with this email already exists"),
      );

      await expect(
        service.updateProfile(mockUserId, { email: "taken@example.com" }),
      ).rejects.toThrow(ConflictError);
    });
  });

  describe("changePassword", () => {
    it("stores a hash of the new password and revokes every session in one call", async () => {
      repo.findById.mockResolvedValue(buildUser({ passwordHash }));

      await service.changePassword(mockUserId, {
        currentPassword: mockPassword,
        newPassword: mockNewPassword,
      });

      const [userId, storedHash] = repo.updatePasswordAndRevokeSessions.mock.calls[0]!;
      expect(userId).toBe(mockUserId);
      expect(storedHash).not.toBe(mockNewPassword);
      expect(await verifyPassword(mockNewPassword, storedHash)).toBe(true);
    });

    it("rejects a wrong current password with a 400 on that field, changing nothing", async () => {
      repo.findById.mockResolvedValue(buildUser({ passwordHash }));

      const attempt = service.changePassword(mockUserId, {
        currentPassword: mockWrongPassword,
        newPassword: mockNewPassword,
      });

      await expect(attempt).rejects.toThrow(BadRequestError);
      await expect(attempt).rejects.toMatchObject({
        statusCode: 400,
        details: { fieldErrors: { currentPassword: ["Current password is incorrect"] } },
      });
      expect(repo.updatePasswordAndRevokeSessions).not.toHaveBeenCalled();
    });

    it("throws NotFoundError when the user doesn't exist", async () => {
      repo.findById.mockResolvedValue(null);

      await expect(
        service.changePassword(mockUserId, {
          currentPassword: mockPassword,
          newPassword: mockNewPassword,
        }),
      ).rejects.toThrow(NotFoundError);
    });
  });
});
