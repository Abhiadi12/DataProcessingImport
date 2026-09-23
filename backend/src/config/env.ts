import { config } from "dotenv";
import { expand } from "dotenv-expand";
import { z } from "zod";
import { JWT_SECRET_MIN_LENGTH, PASSWORD_MIN_LENGTH } from "../constants/index.js";

// INFO: Load environment variables from .env file and expand any variables that reference other variables
expand(config({ quiet: true }));

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace"]).default("info"),
  DATABASE_URL: z.string().url(),
  JWT_ACCESS_SECRET: z
    .string()
    .min(
      JWT_SECRET_MIN_LENGTH,
      `JWT_ACCESS_SECRET must be at least ${JWT_SECRET_MIN_LENGTH} characters`,
    ),
  JWT_ACCESS_TTL_SECONDS: z.coerce.number().int().positive().default(900),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().positive().default(7),
  COOKIE_SECURE: z
    .enum(["true", "false"])
    .default("true")
    .transform((value) => value === "true"),
  // Optional: only the seed script reads these, so the app still boots without them.
  SEED_ADMIN_EMAIL: z.string().trim().toLowerCase().email().optional(),
  SEED_ADMIN_PASSWORD: z.string().min(PASSWORD_MIN_LENGTH).optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment configuration:");
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
