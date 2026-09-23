import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from "./validation.constants.js";

// Messages that reach the client are part of the API contract, and several are
// deliberately identical across different failures (see AUTH.INVALID_CREDENTIALS).
// Keeping them here stops those pairs from drifting apart.

export const AUTH_MESSAGES = {
  // Used for BOTH an unknown email and a wrong password: telling them apart
  // would turn login into a way to discover which emails are registered.
  INVALID_CREDENTIALS: "Invalid email or password",
  ACCOUNT_DISABLED: "This account has been disabled",
  NOT_AUTHENTICATED: "Not authenticated",
  MISSING_AUTH_HEADER: "Missing or malformed Authorization header",
  INVALID_ACCESS_TOKEN: "Invalid access token",
  ACCESS_TOKEN_EXPIRED: "Access token expired",
  MISSING_REFRESH_TOKEN: "Missing refresh token",
  // Also deliberately generic: a thief must not learn they tripped the alarm.
  INVALID_REFRESH_TOKEN: "Invalid refresh token",
  REFRESH_TOKEN_EXPIRED: "Refresh token expired",
  REGISTERED: "Registration successful",
  LOGGED_IN: "Login successful",
  TOKEN_REFRESHED: "Token refreshed",
  LOGGED_OUT: "Logged out",
  LOGGED_OUT_EVERYWHERE: "Logged out of all sessions",
  REUSE_DETECTED: "Refresh token reuse detected; session family revoked",
} as const;

export const USER_MESSAGES = {
  NOT_FOUND: "User not found",
  EMAIL_TAKEN: "An account with this email already exists",
  CURRENT_PASSWORD_INCORRECT: "Current password is incorrect",
  FORBIDDEN: "You do not have permission to perform this action",
  CANNOT_MODIFY_SELF: "You cannot change your own role or active status",
  CANNOT_DEMOTE_ADMIN: "You cannot demote an admin to a lower role",
  PROFILE_FETCHED: "Profile fetched",
  PROFILE_UPDATED: "Profile updated",
  PASSWORD_CHANGED: "Password changed. Please log in again.",
  USERS_FETCHED: "Users fetched",
  USER_FETCHED: "User fetched",
  USER_UPDATED: "User updated",
} as const;

export const VALIDATION_MESSAGES = {
  INVALID_BODY: "Invalid request body",
  INVALID_QUERY: "Invalid query parameters",
  INVALID_PARAMS: "Invalid route parameters",
  PASSWORD_TOO_SHORT: `Password must be at least ${PASSWORD_MIN_LENGTH} characters`,
  PASSWORD_TOO_LONG: `Password must be at most ${PASSWORD_MAX_LENGTH} characters`,
  CURRENT_PASSWORD_REQUIRED: "Current password is required",
  NEW_PASSWORD_MUST_DIFFER: "New password must be different from the current password",
  PROVIDE_NAME_OR_EMAIL: "Provide at least one of name or email",
  PROVIDE_ROLE_OR_STATUS: "Provide at least one of role or isActive",
} as const;

export const COMMON_MESSAGES = {
  INTERNAL_ERROR: "Internal server error",
  HEALTHY: "ok",
  noRouteFor: (method: string, path: string) => `No route for ${method} ${path}`,
} as const;
