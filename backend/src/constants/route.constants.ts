export const API_V1_PREFIX = "/api/v1";

// The refresh cookie's Path must match where the auth router is actually
// mounted, or the browser stops sending it and every refresh fails. Deriving
// it from one constant keeps the two from drifting apart.
export const AUTH_ROUTE_PREFIX = `${API_V1_PREFIX}/auth`;

export const REFRESH_TOKEN_COOKIE = "refresh_token";
