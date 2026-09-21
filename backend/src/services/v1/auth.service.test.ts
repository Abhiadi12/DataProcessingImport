import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { env } from "../../config/env.js";
import { ConflictError } from "../../errors/conflict.error.js";
import { UnauthorizedError } from "../../errors/unauthorized.error.js";
import {
  asUserRepository,
  buildUser,
  createFakeUserRepository,
  type FakeUserRepository,
} from "../../testing/factories.js";
import {
  mockLoginInput,
  mockPassword,
  mockRegisterInput,
  mockUnknownEmail,
  mockWrongPassword,
} from "../../testing/mockData/index.js";
import { signAccessToken, verifyAccessToken } from "../../utils/jwt.js";
import { hashPassword, verifyPassword } from "../../utils/password.js";
import { AuthService } from "./auth.service.js";

describe("AuthService", () => {
  let repo: FakeUserRepository;
  let service: AuthService;
  let passwordHash: string;

  // Hash once for the whole file: bcrypt is deliberately slow.
  beforeAll(async () => {
    passwordHash = await hashPassword(mockPassword);
  });

  // A fresh fake repository per test, so no test can leak state into another.
  beforeEach(() => {
    repo = createFakeUserRepository();
    service = new AuthService(asUserRepository(repo));
  });

  describe("register", () => {
    it("stores a hash of the password, never the password itself", async () => {
      repo.create.mockImplementation(async (data) => buildUser(data));

      await service.register(mockRegisterInput);

      const saved = repo.create.mock.calls[0]![0];
      expect(saved.passwordHash).not.toBe(mockPassword);
      expect(await verifyPassword(mockPassword, saved.passwordHash)).toBe(true);
    });

    it("returns the created user without the password hash", async () => {
      repo.create.mockResolvedValue(buildUser());

      const user = await service.register(mockRegisterInput);

      expect(user).not.toHaveProperty("passwordHash");
      expect(user.email).toBe(mockRegisterInput.email);
    });

    it("ConflictError through for a duplicate email", async () => {
      repo.create.mockRejectedValue(new ConflictError("An account with this email already exists"));

      await expect(service.register(mockRegisterInput)).rejects.toThrow(ConflictError);
    });
  });

  describe("login", () => {
    it("returns a bearer token for the user and their public profile", async () => {
      const user = buildUser({ passwordHash });
      repo.findByEmail.mockResolvedValue(user);

      const result = await service.login(mockLoginInput);

      expect(verifyAccessToken(result.accessToken)).toBe(user.id);
      expect(result.tokenType).toBe("Bearer");
      expect(result.expiresIn).toBe(env.JWT_ACCESS_TTL_SECONDS);
      expect(result.user).not.toHaveProperty("passwordHash");
    });

    it("rejects an unknown email with the generic message", async () => {
      repo.findByEmail.mockResolvedValue(null);

      await expect(service.login({ ...mockLoginInput, email: mockUnknownEmail })).rejects.toThrow(
        new UnauthorizedError("Invalid email or password"),
      );
    });

    it("rejects a wrong password with the exact same message", async () => {
      repo.findByEmail.mockResolvedValue(buildUser({ passwordHash }));

      await expect(
        service.login({ ...mockLoginInput, password: mockWrongPassword }),
      ).rejects.toThrow(new UnauthorizedError("Invalid email or password"));
    });
  });

  describe("authenticate", () => {
    it("returns the user's id and current role for a valid token", async () => {
      const user = buildUser({ role: "MANAGER" });
      repo.findById.mockResolvedValue(user);

      const result = await service.authenticate(signAccessToken(user.id));

      expect(result).toEqual({ id: user.id, role: "MANAGER" });
      expect(repo.findById).toHaveBeenCalledWith(user.id);
    });

    it("rejects a valid token for a user that no longer exists", async () => {
      repo.findById.mockResolvedValue(null);

      await expect(service.authenticate(signAccessToken("deleted-user-id"))).rejects.toThrow(
        UnauthorizedError,
      );
    });
  });
});
