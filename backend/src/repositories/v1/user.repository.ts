import { Prisma, type PrismaClient, type User } from "@prisma/client";
import { ConflictError } from "../../errors/conflict.error.js";

export interface CreateUserData {
  email: string;
  passwordHash: string;
  name: string;
}

export class UserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(data: CreateUserData): Promise<User> {
    try {
      return await this.prisma.user.create({ data });
    } catch (error) {
      // INFO: P2002 = unique constraint violation. The database's unique index is the
      // real guarantee against duplicate emails, including two concurrent
      // registrations that both pass any "does it exist?" check.
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new ConflictError("An account with this email already exists");
      }
      throw error;
    }
  }

  findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }
}
