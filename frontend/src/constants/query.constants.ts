export const QUERY_KEYS = {
  HEALTH: ["health"],
  // All user queries share the "users" prefix, so one invalidation of
  // QUERY_KEYS.USERS_ALL refreshes the list and every open detail.
  USERS_ALL: ["users"],
  ME: ["users", "me"],
  USERS_LIST: ["users", "list"],
  USER_DETAIL: ["users", "detail"],
} as const;

export const QUERY_DEFAULTS = {
  STALE_TIME_MS: 30_000,
  RETRY_COUNT: 1,
} as const;

export const HEALTH_POLL_INTERVAL_MS = 30_000;
