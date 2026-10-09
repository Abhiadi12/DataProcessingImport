export const QUERY_KEYS = {
  HEALTH: ["health"],
  // All user queries share the "users" prefix, so one invalidation of
  // QUERY_KEYS.USERS_ALL refreshes the list and every open detail.
  USERS_ALL: ["users"],
  ME: ["users", "me"],
  USERS_LIST: ["users", "list"],
  USER_DETAIL: ["users", "detail"],
  // Same idea for projects: PROJECTS_ALL covers the list and every detail.
  PROJECTS_ALL: ["projects"],
  PROJECTS_LIST: ["projects", "list"],
  PROJECT_DETAIL: ["projects", "detail"],
  PROJECT_MEMBERS: ["projects", "members"],
  // A global schema shows up in every project's list, so schema changes
  // invalidate IMPORT_SCHEMAS_ALL rather than one project's list.
  IMPORT_SCHEMAS_ALL: ["import-schemas"],
  IMPORT_SCHEMAS_LIST: ["import-schemas", "list"],
  IMPORT_SCHEMA_DETAIL: ["import-schemas", "detail"],
  DASHBOARD: ["dashboard"],
  ADMIN_DASHBOARD: ["admin-dashboard"],
  IMPORTS_ALL: ["imports"],
  IMPORTS_LIST: ["imports", "list"],
  IMPORT_DETAIL: ["imports", "detail"],
  IMPORT_PROGRESS: ["imports", "progress"],
} as const;

export const QUERY_DEFAULTS = {
  STALE_TIME_MS: 30_000,
  RETRY_COUNT: 1,
} as const;

export const HEALTH_POLL_INTERVAL_MS = 30_000;

//INFO: How often the dashboard refreshes while any import it covers is running.
export const DASHBOARD_POLL_INTERVAL_MS = 10_000;

export const IMPORTS_POLL_INTERVAL_MS = 5_000;

export const IMPORT_PROGRESS_POLL_INTERVAL_MS = 1_500;
