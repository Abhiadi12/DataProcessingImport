export const API_V1_PREFIX = "/api/v1";

// The refresh cookie's Path must match where the auth router is actually
// mounted, or the browser stops sending it and every refresh fails. Deriving
// it from one constant keeps the two from drifting apart.
export const AUTH_ROUTE_PREFIX = `${API_V1_PREFIX}/auth`;

export const REFRESH_TOKEN_COOKIE = "refresh_token";

/** Client-supplied, expected to be a UUID. Optional on every route. */
export const IDEMPOTENCY_HEADER = "idempotency-key";
/** Set on a replayed response so clients can tell a replay from fresh work. */
export const IDEMPOTENCY_REPLAY_HEADER = "idempotent-replay";
export const IDEMPOTENCY_KEY_MAX_LENGTH = 255;
/** Keys are remembered for a day, then reaped. */
export const IDEMPOTENCY_TTL_MS = 24 * 60 * 60 * 1000;
/** An IN_PROGRESS row older than this is assumed abandoned by a dead process. */
export const IDEMPOTENCY_STALE_AFTER_MS = 5 * 60 * 1000;
