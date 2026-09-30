export const QUERY_KEYS = {
  HEALTH: ["health"],
} as const;

export const QUERY_DEFAULTS = {
  STALE_TIME_MS: 30_000,
  RETRY_COUNT: 1,
} as const;

export const HEALTH_POLL_INTERVAL_MS = 30_000;
