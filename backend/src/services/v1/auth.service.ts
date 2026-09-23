import { randomUUID } from "node:crypto";
import type { Role, User } from "@prisma/client";
import { AUTH_MESSAGES, MS_PER_DAY } from "../../constants/index.js";
import { env } from "../../config/env.js";
import { ForbiddenError } from "../../errors/forbidden.error.js";
import { UnauthorizedError } from "../../errors/unauthorized.error.js";
import type {
  CreateRefreshTokenData,
  RefreshTokenRepository,
} from "../../repositories/v1/refresh-token.repository.js";
import type { UserRepository } from "../../repositories/v1/user.repository.js";
import { signAccessToken, verifyAccessToken } from "../../utils/jwt.js";
import { logger } from "../../utils/logger.js";
import { hashPassword, verifyPassword } from "../../utils/password.js";
import { generateRefreshToken, hashRefreshToken } from "../../utils/refresh-token.js";
import { toPublicUser, type PublicUser } from "./user.mapper.js";

export interface RegisterInput {
  email: string;
  password: string;
  name: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface IssuedRefreshToken {
  value: string;
  expiresAt: Date;
}

export interface AuthSession {
  accessToken: string;
  tokenType: "Bearer";
  expiresIn: number;
  user: PublicUser;
  refreshToken: IssuedRefreshToken;
}

export interface AuthenticatedUser {
  id: string;
  role: Role;
}

interface NewRefreshToken {
  value: string;
  record: CreateRefreshTokenData;
}

export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly refreshTokenRepository: RefreshTokenRepository,
  ) {}

  async register(input: RegisterInput): Promise<PublicUser> {
    const passwordHash = await hashPassword(input.password);
    const user = await this.userRepository.create({
      email: input.email,
      passwordHash,
      name: input.name,
    });
    return toPublicUser(user);
  }

  async login(input: LoginInput): Promise<AuthSession> {
    const user = await this.userRepository.findByEmail(input.email);
    const passwordMatches = await verifyPassword(input.password, user?.passwordHash ?? null);

    if (!user || !passwordMatches) {
      throw new UnauthorizedError(AUTH_MESSAGES.INVALID_CREDENTIALS);
    }

    if (!user.isActive) {
      throw new ForbiddenError(AUTH_MESSAGES.ACCOUNT_DISABLED);
    }

    //INFO: Every login starts a new family, so logging out one device leaves the others alone.
    const refreshToken = this.newRefreshToken(user.id, randomUUID());
    await this.refreshTokenRepository.create(refreshToken.record);

    return this.buildSession(user, refreshToken);
  }

  async refresh(presentedToken: string): Promise<AuthSession> {
    const current = await this.refreshTokenRepository.findByHash(hashRefreshToken(presentedToken));
    if (!current) {
      throw new UnauthorizedError(AUTH_MESSAGES.INVALID_REFRESH_TOKEN);
    }

    // A revoked token being presented means it was copied: the legitimate client
    // already swapped it for a newer one. We can't tell who holds which copy,
    // so end the whole session for everyone.
    if (current.revokedAt) {
      await this.revokeFamilyForReuse(current.familyId, current.userId);
    }

    if (current.expiresAt <= new Date()) {
      throw new UnauthorizedError(AUTH_MESSAGES.REFRESH_TOKEN_EXPIRED);
    }

    const user = await this.userRepository.findById(current.userId);
    if (!user || !user.isActive) {
      await this.refreshTokenRepository.revokeFamily(current.familyId);
      throw new UnauthorizedError(AUTH_MESSAGES.INVALID_REFRESH_TOKEN);
    }

    const next = this.newRefreshToken(user.id, current.familyId);
    const rotated = await this.refreshTokenRepository.rotate(current.id, next.record);
    if (!rotated) {
      await this.revokeFamilyForReuse(current.familyId, current.userId);
    }

    return this.buildSession(user, next);
  }

  async logout(presentedToken: string | undefined): Promise<void> {
    if (!presentedToken) return;

    const current = await this.refreshTokenRepository.findByHash(hashRefreshToken(presentedToken));
    if (current) {
      await this.refreshTokenRepository.revokeFamily(current.familyId);
    }
  }

  async logoutAll(userId: string): Promise<void> {
    await this.refreshTokenRepository.revokeAllForUser(userId);
  }

  async authenticate(accessToken: string): Promise<AuthenticatedUser> {
    const userId = verifyAccessToken(accessToken);
    const user = await this.userRepository.findById(userId);
    if (!user || !user.isActive) {
      throw new UnauthorizedError(AUTH_MESSAGES.INVALID_ACCESS_TOKEN);
    }
    return { id: user.id, role: user.role };
  }

  private async revokeFamilyForReuse(familyId: string, userId: string): Promise<never> {
    await this.refreshTokenRepository.revokeFamily(familyId);
    logger.warn({ userId, familyId }, AUTH_MESSAGES.REUSE_DETECTED);
    throw new UnauthorizedError(AUTH_MESSAGES.INVALID_REFRESH_TOKEN);
  }

  private newRefreshToken(userId: string, familyId: string): NewRefreshToken {
    const value = generateRefreshToken();
    return {
      value,
      record: {
        userId,
        familyId,
        tokenHash: hashRefreshToken(value),
        expiresAt: new Date(Date.now() + env.REFRESH_TOKEN_TTL_DAYS * MS_PER_DAY),
      },
    };
  }

  private buildSession(user: User, refreshToken: NewRefreshToken): AuthSession {
    return {
      accessToken: signAccessToken(user.id),
      tokenType: "Bearer",
      expiresIn: env.JWT_ACCESS_TTL_SECONDS,
      user: toPublicUser(user),
      refreshToken: { value: refreshToken.value, expiresAt: refreshToken.record.expiresAt },
    };
  }
}
