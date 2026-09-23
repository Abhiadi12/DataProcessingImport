import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    environment: "node",
    // Applied before any test file is imported, so src/config/env.ts validates
    // against these instead of a developer's local .env (dotenv never
    // overrides a variable that's already set).
    env: {
      NODE_ENV: "test",
      LOG_LEVEL: "fatal",
      DATABASE_URL: "postgresql://test:test@localhost:5432/test?schema=public",
      JWT_ACCESS_SECRET: "test-secret-that-is-at-least-32-characters-long",
      JWT_ACCESS_TTL_SECONDS: "900",
    },
    restoreMocks: true,
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts"],
      exclude: ["src/**/*.test.ts", "src/testing/**", "src/seed/**", "src/api/index.ts"],
    },
  },
});
