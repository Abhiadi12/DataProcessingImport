import { Prisma, type PrismaClient, type User } from "@prisma/client";
import { ConflictError } from "../../errors/conflict.error.js";
import { NotFoundError } from "../../errors/not-found.error.js";

export interface CreateUserData {
  email: string;
  passwordHash: string;
  name: string;
}

export interface UpdateProfileData {
  name?: string;
  email?: string;
}

export class UserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(data: CreateUserData): Promise<User> {
    try {
      return await this.prisma.user.create({ data });
    } catch (error) {
      throw toDomainError(error);
    }
  }

  findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async updateProfile(id: string, data: UpdateProfileData): Promise<User> {
    try {
      return await this.prisma.user.update({ where: { id }, data });
    } catch (error) {
      throw toDomainError(error);
    }
  }

  async updatePasswordAndRevokeSessions(id: string, passwordHash: string): Promise<void> {
    try {
      await this.prisma.user.update({
        where: { id },
        data: {
          passwordHash,
          refreshTokens: {
            updateMany: { where: { revokedAt: null }, data: { revokedAt: new Date() } },
          },
        },
      });
    } catch (error) {
      throw toDomainError(error);
    }
  }
}

function toDomainError(error: unknown): unknown {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    //INFO: P2002 = unique constraint violation. The unique index on email is the real
    // guarantee against duplicates, including two concurrent requests that both
    // pass any "does it exist?" check.
    if (error.code === "P2002") {
      return new ConflictError("An account with this email already exists");
    }
    //INFO: P2025 = the row to update doesn't exist.
    if (error.code === "P2025") {
      return new NotFoundError("User not found");
    }
  }
  return error;
}
