import { S3Client } from "@aws-sdk/client-s3";
import { PrismaClient } from "@prisma/client";
import { Redis } from "ioredis";
import { env } from "./config/env.js";
import { logger } from "./utils/logger.js";
import { ImportPublisher } from "./queue/import-publisher.js";
import { QueueConnection } from "./queue/connection.js";
import { DashboardRepository } from "./repositories/v1/dashboard.repository.js";
import { IdempotencyRepository } from "./repositories/v1/idempotency.repository.js";
import { ImportRecordRepository } from "./repositories/v1/import-record.repository.js";
import { ImportRepository } from "./repositories/v1/import.repository.js";
import { ImportSchemaRepository } from "./repositories/v1/import-schema.repository.js";
import { ProjectRepository } from "./repositories/v1/project.repository.js";
import { RefreshTokenRepository } from "./repositories/v1/refresh-token.repository.js";
import { UserRepository } from "./repositories/v1/user.repository.js";
import { AuthService } from "./services/v1/auth.service.js";
import { DashboardService } from "./services/v1/dashboard.service.js";
import { QueueMetricsService } from "./services/v1/queue-metrics.service.js";
import { ImportProgressService } from "./services/v1/import-progress.service.js";
import { ImportService } from "./services/v1/import.service.js";
import { ImportSchemaService } from "./services/v1/import-schema.service.js";
import { ProjectService } from "./services/v1/project.service.js";
import { StorageService } from "./services/v1/storage.service.js";
import { UserService } from "./services/v1/user.service.js";
import { MAX_RETRY_ATTEMPTS } from "./constants/index.js";

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

const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: MAX_RETRY_ATTEMPTS,
});
redis.on("error", (error: Error) => logger.warn({ err: error }, "Redis error"));

const userRepository = new UserRepository(prisma);
const refreshTokenRepository = new RefreshTokenRepository(prisma);
const projectRepository = new ProjectRepository(prisma);
const importSchemaRepository = new ImportSchemaRepository(prisma);
const importRepository = new ImportRepository(prisma);
const importRecordRepository = new ImportRecordRepository(prisma);
const idempotencyRepository = new IdempotencyRepository(prisma);
const dashboardRepository = new DashboardRepository(prisma);

const queueConnection = new QueueConnection();
const importPublisher = new ImportPublisher(queueConnection);

const authService = new AuthService(userRepository, refreshTokenRepository);
const userService = new UserService(userRepository);
const projectService = new ProjectService(projectRepository, userRepository);
const storageService = new StorageService(s3, env.S3_BUCKET);
const importProgressService = new ImportProgressService(redis);
const queueMetricsService = new QueueMetricsService(
  env.RABBITMQ_MANAGEMENT_URL,
  env.RABBITMQ_MANAGEMENT_USER,
  env.RABBITMQ_MANAGEMENT_PASSWORD,
);
const dashboardService = new DashboardService(dashboardRepository, queueMetricsService);
const importSchemaService = new ImportSchemaService(importSchemaRepository, projectRepository);
const importService = new ImportService(
  importRepository,
  importRecordRepository,
  importSchemaRepository,
  projectRepository,
  storageService,
  importPublisher,
  importProgressService,
);

export const container = {
  prisma,
  redis,
  importProgressService,
  s3,
  authService,
  userService,
  projectService,
  storageService,
  importSchemaService,
  importService,
  dashboardService,
  queueMetricsService,
  importRepository,
  importRecordRepository,
  importSchemaRepository,
  idempotencyRepository,
  queueConnection,
  importPublisher,
};
