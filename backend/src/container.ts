import { S3Client } from "@aws-sdk/client-s3";
import { PrismaClient } from "@prisma/client";
import { env } from "./config/env.js";
import { ImportRepository } from "./repositories/v1/import.repository.js";
import { ImportSchemaRepository } from "./repositories/v1/import-schema.repository.js";
import { ProjectRepository } from "./repositories/v1/project.repository.js";
import { RefreshTokenRepository } from "./repositories/v1/refresh-token.repository.js";
import { UserRepository } from "./repositories/v1/user.repository.js";
import { AuthService } from "./services/v1/auth.service.js";
import { ImportService } from "./services/v1/import.service.js";
import { ImportSchemaService } from "./services/v1/import-schema.service.js";
import { ProjectService } from "./services/v1/project.service.js";
import { StorageService } from "./services/v1/storage.service.js";
import { UserService } from "./services/v1/user.service.js";

const prisma = new PrismaClient({
  log: env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
});

const s3 = new S3Client({
  endpoint: env.S3_ENDPOINT,
  region: env.S3_REGION,
  forcePathStyle: env.S3_FORCE_PATH_STYLE,
  credentials: {
    accessKeyId: env.S3_ACCESS_KEY,
    secretAccessKey: env.S3_SECRET_KEY,
  },
});

const userRepository = new UserRepository(prisma);
const refreshTokenRepository = new RefreshTokenRepository(prisma);
const projectRepository = new ProjectRepository(prisma);
const importSchemaRepository = new ImportSchemaRepository(prisma);
const importRepository = new ImportRepository(prisma);

const authService = new AuthService(userRepository, refreshTokenRepository);
const userService = new UserService(userRepository);
const projectService = new ProjectService(projectRepository, userRepository);
const storageService = new StorageService(s3, env.S3_BUCKET);
const importSchemaService = new ImportSchemaService(importSchemaRepository, projectRepository);
const importService = new ImportService(
  importRepository,
  importSchemaRepository,
  projectRepository,
  storageService,
);

export const container = {
  prisma,
  s3,
  authService,
  userService,
  projectService,
  storageService,
  importSchemaService,
  importService,
};
