import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from "./validation.constants.js";

// Messages that reach the client are part of the API contract, and several are
// deliberately identical across different failures (see AUTH.INVALID_CREDENTIALS).
// Keeping them here stops those pairs from drifting apart.

export const AUTH_MESSAGES = {
  INVALID_CREDENTIALS: "Invalid email or password",
  ACCOUNT_DISABLED: "This account has been disabled",
  NOT_AUTHENTICATED: "Not authenticated",
  MISSING_AUTH_HEADER: "Missing or malformed Authorization header",
  INVALID_ACCESS_TOKEN: "Invalid access token",
  ACCESS_TOKEN_EXPIRED: "Access token expired",
  MISSING_REFRESH_TOKEN: "Missing refresh token",
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

export const PROJECT_MESSAGES = {
  NOT_FOUND: "Project not found",
  NOT_A_MEMBER: "You are not a member of this project",
  CREATED: "Project created",
  FETCHED: "Project fetched",
  LIST_FETCHED: "Projects fetched",
  UPDATED: "Project updated",
  DELETED: "Project deleted",
  MEMBERS_FETCHED: "Project members fetched",
  MEMBER_ADDED: "Member added to project",
  MEMBER_REMOVED: "Member removed from project",
  ALREADY_A_MEMBER: "That user is already a member of this project",
  TARGET_NOT_A_MEMBER: "That user is not a member of this project",
  LAST_MEMBER: "A project must have at least one member",
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
  PROVIDE_NAME_OR_DESCRIPTION: "Provide at least one of name or description",
  PROVIDE_ROLE_OR_STATUS: "Provide at least one of role or isActive",
} as const;

export const COMMON_MESSAGES = {
  INTERNAL_ERROR: "Internal server error",
  HEALTHY: "ok",
  noRouteFor: (method: string, path: string) => `No route for ${method} ${path}`,
} as const;

export const IMPORT_MESSAGES = {
  NOT_FOUND: "Import not found",
  CREATED: "Upload prepared",
  STARTED: "Import queued for processing",
  SCHEMA_NOT_FOUND: "That import schema does not exist",
  SCHEMA_ARCHIVED: "That import schema is archived and cannot be used for new imports",
  SCHEMA_NOT_VISIBLE: "That import schema does not belong to this project",
  FILE_TOO_LARGE: "File is larger than the maximum upload size",
  UNSUPPORTED_EXTENSION: "Only .csv files are supported",
  UNSUPPORTED_CONTENT_TYPE: "That content type is not valid for a .csv file",
  // start() guards. Deliberately distinct messages: "you never uploaded" and
  // "you uploaded something else" are different mistakes.
  NOT_AWAITING_UPLOAD: "This import is not awaiting an upload",
  OBJECT_MISSING: "No uploaded file was found for this import",
  sizeMismatch: (declared: number, actual: number) =>
    `Uploaded file is ${actual} bytes but ${declared} was declared`,
  FILE_EMPTY: "The uploaded file is empty",
  OBJECT_VANISHED: "The uploaded file is no longer in storage",
  NO_HEADER_ROW: "The file has no header row",
  missingColumns: (names: string[]) =>
    `The file is missing required column(s): ${names.join(", ")}`,
  COMPLETED: "Import completed",
  ALREADY_STARTED: "This import has already been started",
} as const;

export const IMPORT_SCHEMA_MESSAGES = {
  NOT_FOUND: "Import schema not found",
  CREATED: "Import schema created",
  FETCHED: "Import schema fetched",
  LIST_FETCHED: "Import schemas fetched",
  ARCHIVED: "Import schema archived",
  NAME_TAKEN: "An import schema with that name already exists in this project",
  GLOBAL_NAME_TAKEN: "A global import schema with that name already exists",
  ALREADY_ARCHIVED: "That import schema is already archived",
  IN_USE: "That import schema has imports and cannot be archived",
  GLOBAL_REQUIRES_ADMIN: "Only an admin can manage global import schemas",
  NEEDS_AT_LEAST_ONE_FIELD: "Define at least one field",
  TOO_MANY_FIELDS: "Too many fields in one schema",
  NEEDS_UNIQUE_FIELD:
    "Mark at least one field unique — it identifies a record, and duplicate detection and retry idempotency both depend on it",
  UNIQUE_MUST_BE_REQUIRED:
    "A unique field must also be required: a blank value cannot identify a record",
  UNIQUE_TYPE_UNSUITABLE: "A boolean field cannot identify a record, so it cannot be unique",
  INVALID_FIELD_NAME:
    "Field names must start with a letter and contain only letters, numbers and underscores",
} as const;

export const STORAGE_MESSAGES = {
  BUCKET_ENSURE_FAILED: "Could not verify or create the storage bucket",
  PRESIGN_FAILED: "Could not generate a storage URL",
  HEAD_FAILED: "Could not read object metadata from storage",
  DELETE_FAILED: "Could not delete objects from storage",
  LIST_FAILED: "Could not list objects in storage",
  GET_FAILED: "Could not read the object from storage",
  UPLOAD_FAILED: "Could not upload to storage",
} as const;
