import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { env } from "../../config/env.js";
import { ConflictError } from "../../errors/conflict.error.js";
import { UnauthorizedError } from "../../errors/unauthorized.error.js";
import {
  asRefreshTokenRepository,
  asUserRepository,
  buildRefreshToken,
  buildUser,
  createFakeRefreshTokenRepository,
  createFakeUserRepository,
  type FakeRefreshTokenRepository,
  type FakeUserRepository,
} from "../../testing/factories.js";
import {
  mockFamilyId,
  mockLoginInput,
  mockPassword,
  mockRefreshToken,
  mockRefreshTokenValue,
  mockRegisterInput,
  mockUnknownEmail,
  mockUserId,
  mockWrongPassword,
} from "../../testing/mockData/index.js";
import { signAccessToken, verifyAccessToken } from "../../utils/jwt.js";
import { hashPassword, verifyPassword } from "../../utils/password.js";
import { hashRefreshToken } from "../../utils/refresh-token.js";
import { AuthService } from "./auth.service.js";

describe("AuthService", () => {
  let repo: FakeUserRepository;
  let refreshTokenRepo: FakeRefreshTokenRepository;
  let service: AuthService;
  let passwordHash: string;

  // Hash once for the whole file: bcrypt is deliberately slow.
  beforeAll(async () => {
    passwordHash = await hashPassword(mockPassword);
  });

  // Fresh fakes per test, so no test can leak state into another.
  beforeEach(() => {
    repo = createFakeUserRepository();
    refreshTokenRepo = createFakeRefreshTokenRepository();
    service = new AuthService(asUserRepository(repo), asRefreshTokenRepository(refreshTokenRepo));
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

    it("starts a different family on every login", async () => {
      repo.findByEmail.mockResolvedValue(buildUser({ passwordHash }));

      await service.login(mockLoginInput);
      await service.login(mockLoginInput);

      const [first, second] = refreshTokenRepo.create.mock.calls;
      expect(first![0].familyId).not.toBe(second![0].familyId);
    });
  });

  describe("refresh", () => {
    it("rotates within the same family and returns a brand-new token pair", async () => {
      refreshTokenRepo.findByHash.mockResolvedValue(buildRefreshToken());
      repo.findById.mockResolvedValue(buildUser());
      refreshTokenRepo.rotate.mockResolvedValue(true);

      const session = await service.refresh(mockRefreshTokenValue);

      expect(refreshTokenRepo.findByHash).toHaveBeenCalledWith(
        hashRefreshToken(mockRefreshTokenValue),
      );
      const [rotatedId, next] = refreshTokenRepo.rotate.mock.calls[0]!;
      expect(rotatedId).toBe(mockRefreshToken.id);
      expect(next.familyId).toBe(mockFamilyId);
      expect(next.tokenHash).toBe(hashRefreshToken(session.refreshToken.value));
      expect(session.refreshToken.value).not.toBe(mockRefreshTokenValue);
      expect(verifyAccessToken(session.accessToken)).toBe(mockUserId);
    });

    it("rejects a token it never issued", async () => {
      refreshTokenRepo.findByHash.mockResolvedValue(null);

      await expect(service.refresh("never-issued")).rejects.toThrow(UnauthorizedError);
      expect(refreshTokenRepo.revokeFamily).not.toHaveBeenCalled();
    });

    it("treats an already-rotated token as stolen and revokes its whole family", async () => {
      refreshTokenRepo.findByHash.mockResolvedValue(buildRefreshToken({ revokedAt: new Date() }));

      await expect(service.refresh(mockRefreshTokenValue)).rejects.toThrow(
        new UnauthorizedError("Invalid refresh token"),
      );
      expect(refreshTokenRepo.revokeFamily).toHaveBeenCalledWith(mockFamilyId);
      expect(refreshTokenRepo.rotate).not.toHaveBeenCalled();
    });

    it("rejects an expired token without rotating it", async () => {
      refreshTokenRepo.findByHash.mockResolvedValue(
        buildRefreshToken({ expiresAt: new Date(Date.now() - 1000) }),
      );

      await expect(service.refresh(mockRefreshTokenValue)).rejects.toThrow("Refresh token expired");
      expect(refreshTokenRepo.rotate).not.toHaveBeenCalled();
    });

    it("ends the session if the user has been deactivated since logging in", async () => {
      refreshTokenRepo.findByHash.mockResolvedValue(buildRefreshToken());
      repo.findById.mockResolvedValue(buildUser({ isActive: false }));

      await expect(service.refresh(mockRefreshTokenValue)).rejects.toThrow(UnauthorizedError);
      expect(refreshTokenRepo.revokeFamily).toHaveBeenCalledWith(mockFamilyId);
    });
  });

  describe("logout", () => {
    it("revokes the family of the presented token", async () => {
      refreshTokenRepo.findByHash.mockResolvedValue(buildRefreshToken());

      await service.logout(mockRefreshTokenValue);

      expect(refreshTokenRepo.revokeFamily).toHaveBeenCalledWith(mockFamilyId);
    });

    it("does nothing when no token is presented", async () => {
      await service.logout(undefined);

      expect(refreshTokenRepo.findByHash).not.toHaveBeenCalled();
    });
  });

  describe("logoutAll", () => {
    it("revokes every session family belonging to the user", async () => {
      await service.logoutAll(mockUserId);

      expect(refreshTokenRepo.revokeAllForUser).toHaveBeenCalledWith(mockUserId);
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
