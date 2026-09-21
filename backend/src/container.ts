import { PrismaClient } from "@prisma/client";
import { env } from "./config/env.js";
import { UserRepository } from "./repositories/v1/user.repository.js";
import { AuthService } from "./services/v1/auth.service.js";
import { UserService } from "./services/v1/user.service.js";

const prisma = new PrismaClient({
  log: env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
});

const userRepository = new UserRepository(prisma);

const authService = new AuthService(userRepository);
const userService = new UserService(userRepository);

export const container = { prisma, authService, userService };
