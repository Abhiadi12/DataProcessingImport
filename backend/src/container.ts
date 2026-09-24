import { PrismaClient } from "@prisma/client";
import { env } from "./config/env.js";
import { ProjectRepository } from "./repositories/v1/project.repository.js";
import { RefreshTokenRepository } from "./repositories/v1/refresh-token.repository.js";
import { UserRepository } from "./repositories/v1/user.repository.js";
import { AuthService } from "./services/v1/auth.service.js";
import { ProjectService } from "./services/v1/project.service.js";
import { UserService } from "./services/v1/user.service.js";

const prisma = new PrismaClient({
  log: env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
});

const userRepository = new UserRepository(prisma);
const refreshTokenRepository = new RefreshTokenRepository(prisma);
const projectRepository = new ProjectRepository(prisma);

const authService = new AuthService(userRepository, refreshTokenRepository);
const userService = new UserService(userRepository);
const projectService = new ProjectService(projectRepository, userRepository);

export const container = { prisma, authService, userService, projectService };
