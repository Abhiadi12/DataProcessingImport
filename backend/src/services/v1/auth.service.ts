import type { Role } from "@prisma/client";
import { env } from "../../config/env.js";
import { ForbiddenError } from "../../errors/forbidden.error.js";
import { UnauthorizedError } from "../../errors/unauthorized.error.js";
import type { UserRepository } from "../../repositories/v1/user.repository.js";
import { signAccessToken, verifyAccessToken } from "../../utils/jwt.js";
import { hashPassword, verifyPassword } from "../../utils/password.js";
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

export interface LoginResult {
  accessToken: string;
  tokenType: "Bearer";
  expiresIn: number;
  user: PublicUser;
}

export interface AuthenticatedUser {
  id: string;
  role: Role;
}

export class AuthService {
  constructor(private readonly userRepository: UserRepository) {}

  async register(input: RegisterInput): Promise<PublicUser> {
    const passwordHash = await hashPassword(input.password);
    const user = await this.userRepository.create({
      email: input.email,
      passwordHash,
      name: input.name,
    });
    return toPublicUser(user);
  }

  async login(input: LoginInput): Promise<LoginResult> {
    const user = await this.userRepository.findByEmail(input.email);
    const passwordMatches = await verifyPassword(input.password, user?.passwordHash ?? null);

    if (!user || !passwordMatches) {
      throw new UnauthorizedError("Invalid email or password");
    }

    if (!user.isActive) {
      throw new ForbiddenError("This account has been disabled");
    }

    return {
      accessToken: signAccessToken(user.id),
      tokenType: "Bearer",
      expiresIn: env.JWT_ACCESS_TTL_SECONDS,
      user: toPublicUser(user),
    };
  }

  async authenticate(accessToken: string): Promise<AuthenticatedUser> {
    const userId = verifyAccessToken(accessToken);
    const user = await this.userRepository.findById(userId);
    if (!user || !user.isActive) {
      throw new UnauthorizedError("Invalid access token");
    }
    return { id: user.id, role: user.role };
  }
}
