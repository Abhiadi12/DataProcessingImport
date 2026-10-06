import type { FieldType, ImportStatus, Role } from "@/types";
import {
  SCHEMA_DESCRIPTION_MAX_LENGTH,
  SCHEMA_FIELD_NAME_MAX_LENGTH,
  SCHEMA_MAX_FIELDS,
  SCHEMA_NAME_MAX_LENGTH,
} from "./schema.constants";
import {
  NAME_MAX_LENGTH,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  PROJECT_DESCRIPTION_MAX_LENGTH,
  PROJECT_NAME_MAX_LENGTH,
} from "./validation.constants";

export const APP_MESSAGES = {
  NAME: "Data Import Platform",
  TAGLINE: "Upload, validate and process large CSV and JSON files.",
  ROOT_ELEMENT_MISSING: "Root element #root not found in index.html",
} as const;

export const COMMON_MESSAGES = {
  UNKNOWN_ERROR: "Something went wrong. Please try again.",
  NETWORK_ERROR: "Unable to reach the server. Check your connection.",
  BACK_HOME: "Back to home",
  CLOSE: "Close",
  CANCEL: "Cancel",
  SAVE_CHANGES: "Save changes",
  EDIT: "Edit",
  DELETE: "Delete",
} as const;

export const ERROR_BOUNDARY_MESSAGES = {
  TITLE: "Something went wrong",
  DESCRIPTION: "An unexpected error occurred while displaying this page.",
  TRY_AGAIN: "Try again",
  RELOAD: "Reload page",
} as const;

export const HEALTH_MESSAGES = {
  CHECKING: "Checking API…",
  ONLINE: "API online",
  OFFLINE: "API unreachable",
} as const;

export const LOADER_MESSAGES = {
  LOADING: "Loading",
} as const;

export const AUTH_MESSAGES = {
  LOGIN_TITLE: "Sign in",
  LOGIN_SUBTITLE: "Welcome back. Sign in to continue.",
  LOGIN_SUBMIT: "Sign in",
  NO_ACCOUNT: "Don't have an account?",
  GO_TO_REGISTER: "Create one",
  REGISTER_TITLE: "Create account",
  REGISTER_SUBTITLE: "Set up your account to start importing data.",
  REGISTER_SUBMIT: "Create account",
  HAVE_ACCOUNT: "Already have an account?",
  GO_TO_LOGIN: "Sign in",
  REGISTERED: "Account created. Please sign in.",
  ACCOUNT_MENU: "Account menu",
  LOGOUT: "Sign out",
  LOGOUT_ALL: "Sign out of all devices",
  LOGGED_OUT_ALL: "Signed out of all devices.",
} as const;

export const FIELD_LABELS = {
  NAME: "Name",
  EMAIL: "Email",
  PASSWORD: "Password",
  CONFIRM_PASSWORD: "Confirm password",
  CURRENT_PASSWORD: "Current password",
  NEW_PASSWORD: "New password",
  CONFIRM_NEW_PASSWORD: "Confirm new password",
  SHOW_PASSWORD: "Show password",
  HIDE_PASSWORD: "Hide password",
} as const;

export const VALIDATION_MESSAGES = {
  NAME_REQUIRED: "Name is required",
  NAME_TOO_LONG: `Name must be at most ${NAME_MAX_LENGTH} characters`,
  EMAIL_INVALID: "Enter a valid email address",
  PASSWORD_REQUIRED: "Password is required",
  PASSWORD_TOO_SHORT: `Password must be at least ${PASSWORD_MIN_LENGTH} characters`,
  PASSWORD_TOO_LONG: `Password must be at most ${PASSWORD_MAX_LENGTH} characters`,
  PASSWORDS_DO_NOT_MATCH: "Passwords do not match",
  CURRENT_PASSWORD_REQUIRED: "Current password is required",
  NEW_PASSWORD_MUST_DIFFER: "New password must be different from the current password",
  SCHEMA_NAME_REQUIRED: "Schema name is required",
  SCHEMA_NAME_TOO_LONG: `Schema name must be at most ${SCHEMA_NAME_MAX_LENGTH} characters`,
  SCHEMA_DESCRIPTION_TOO_LONG: `Description must be at most ${SCHEMA_DESCRIPTION_MAX_LENGTH} characters`,
  FIELD_NAME_REQUIRED: "Field name is required",
  FIELD_NAME_TOO_LONG: `Field name must be at most ${SCHEMA_FIELD_NAME_MAX_LENGTH} characters`,
  FIELD_NAME_INVALID: "Start with a letter; use only letters, numbers and underscores",
  FIELD_NAME_DUPLICATE: "Another field already has this name",
  SCHEMA_NEEDS_FIELD: "Add at least one field",
  SCHEMA_TOO_MANY_FIELDS: `A schema can have at most ${SCHEMA_MAX_FIELDS} fields`,
  SCHEMA_NEEDS_UNIQUE_FIELD:
    "Mark at least one field as unique. It identifies a record, so duplicates can be detected.",
  UNIQUE_MUST_BE_REQUIRED: "A unique field must also be required",
  UNIQUE_CANNOT_BE_BOOLEAN: "A boolean field cannot be unique",
  FILE_REQUIRED: "Choose a file to upload",
  FILE_TYPE_UNSUPPORTED: "Only .csv files are supported",
  FILE_EMPTY: "This file is empty",
  FILE_TOO_LARGE: "This file is larger than the 2 GB limit",
  SCHEMA_REQUIRED: "Choose a schema",
  PROJECT_NAME_REQUIRED: "Project name is required",
  PROJECT_NAME_TOO_LONG: `Project name must be at most ${PROJECT_NAME_MAX_LENGTH} characters`,
  PROJECT_DESCRIPTION_TOO_LONG: `Description must be at most ${PROJECT_DESCRIPTION_MAX_LENGTH} characters`,
} as const;

export const NAV_MESSAGES = {
  PROJECTS: "Projects",
  USERS: "Users",
  PROFILE: "Profile",
} as const;

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: "Admin",
  MANAGER: "Manager",
  MEMBER: "Member",
};

export const PROFILE_MESSAGES = {
  TITLE: "Profile",
  SUBTITLE: "Manage your account details and password.",
  DETAILS_TITLE: "Account details",
  ROLE: "Role",
  MEMBER_SINCE: "Member since",
  PASSWORD_TITLE: "Change password",
  PASSWORD_HINT: "Changing your password signs you out of every device.",
  PASSWORD_SUBMIT: "Change password",
} as const;

export const USERS_MESSAGES = {
  TITLE: "Users",
  SUBTITLE: "Manage roles and access for everyone on the platform.",
  EMPTY: "No users found.",
  COLUMN_NAME: "Name",
  COLUMN_EMAIL: "Email",
  COLUMN_ROLE: "Role",
  COLUMN_ACTIVE: "Active",
  COLUMN_JOINED: "Joined",
  COLUMN_ACTIONS: "Actions",
  YOU: "You",
  DETAILS_TITLE: "User details",
  STATUS: "Status",
  ACTIVE: "Active",
  INACTIVE: "Deactivated",
  LAST_UPDATED: "Last updated",
  PROMOTE_TITLE: "Make this user an admin?",
  PROMOTE_CONFIRM: "Make admin",
  viewDetailsOf: (name: string) => `View details of ${name}`,
  roleOf: (name: string) => `Role of ${name}`,
  activeStatusOf: (name: string) => `Active status of ${name}`,
  // Admins cannot be demoted by the API, so this cannot be undone from the UI.
  promoteWarning: (name: string) =>
    `${name} will get full access to every project and user. An admin cannot be changed back to a lower role.`,
} as const;

export const PROJECTS_MESSAGES = {
  TITLE: "Projects",
  SUBTITLE: "Workspaces where your team uploads and processes data files.",
  NEW: "New project",
  EMPTY_TITLE: "No projects yet",
  EMPTY_FOR_MANAGER: "Create your first project to start importing data.",
  EMPTY_FOR_MEMBER: "You have not been added to any project yet. Ask a manager to add you.",
  PER_PAGE: "Projects per page",
  NO_DESCRIPTION: "No description",
  CREATED_ON: "Created",
  FIELD_NAME: "Project name",
  FIELD_DESCRIPTION: "Description (optional)",
  CREATE_TITLE: "New project",
  CREATE_SUBMIT: "Create project",
  EDIT_TITLE: "Edit project",
  DELETE_TITLE: "Delete this project?",
  BACK_TO_LIST: "Back to projects",
  TABS_LABEL: "Project sections",
  TAB_MEMBERS: "Members",
  TAB_SCHEMAS: "Schemas",
  TAB_IMPORTS: "Imports",
  FORBIDDEN_TITLE: "You are not a member of this project",
  FORBIDDEN_DESCRIPTION:
    "Only members can open a project. Ask one of its managers to add you, then try again.",
  NOT_FOUND_TITLE: "Project not found",
  NOT_FOUND_DESCRIPTION: "This project does not exist or has been deleted.",
  ERROR_TITLE: "Could not load this project",
  actionsFor: (name: string) => `Actions for ${name}`,
  // Deleting cascades on the backend, so say exactly what goes with it.
  deleteWarning: (name: string) =>
    `"${name}" will be permanently deleted along with its members, schemas and imported data. This cannot be undone.`,
} as const;

export const MEMBERS_MESSAGES = {
  ADD_LABEL: "Add a member by email",
  ADD_SUBMIT: "Add member",
  EMPTY: "This project has no members.",
  COLUMN_JOINED: "Joined",
  REMOVE_TITLE: "Remove this member?",
  REMOVE_CONFIRM: "Remove",
  VIEW_ONLY_TITLE: "Project members",
  // A manager can read any project's member list, but only a member (or an
  // admin) can open the project or change who is in it.
  VIEW_ONLY_NOTICE:
    "You are not a member of this project. As a manager you can see who is in it, but you cannot open the project or change its members.",
  removeLabel: (name: string) => `Remove ${name} from this project`,
  removeWarning: (name: string) => `${name} will lose access to this project and everything in it.`,
  removeSelfWarning: "You will lose access to this project and everything in it.",
} as const;

export const FIELD_TYPE_LABELS: Record<FieldType, string> = {
  string: "Text",
  number: "Number",
  integer: "Whole number",
  boolean: "Yes / No",
  date: "Date",
};

export const SCHEMAS_MESSAGES = {
  INTRO: "A schema describes the columns a file must have before it can be imported.",
  NEW: "New schema",
  EMPTY_TITLE: "No schemas yet",
  EMPTY_FOR_MANAGER: "Create a schema to define which columns an imported file must contain.",
  EMPTY_FOR_MEMBER: "A manager needs to create a schema before files can be imported.",
  COLUMN_NAME: "Name",
  COLUMN_FIELDS: "Fields",
  COLUMN_UNIQUE: "Unique by",
  COLUMN_CREATED: "Created",
  GLOBAL: "Global",
  ARCHIVED: "Archived",
  DETAILS_TITLE: "Schema details",
  DESCRIPTION: "Description",
  NO_DESCRIPTION: "No description",
  SCOPE: "Available in",
  SCOPE_GLOBAL: "Every project",
  SCOPE_PROJECT: "This project only",
  IMPORTS_USING: "Imports using it",
  FIELDS_TITLE: "Fields",
  FIELD_NAME: "Field name",
  FIELD_TYPE: "Type",
  FIELD_REQUIRED: "Required",
  FIELD_UNIQUE: "Unique",
  YES: "Yes",
  NO: "No",
  CREATE_TITLE: "New import schema",
  CREATE_SUBMIT: "Create schema",
  IMMUTABLE_NOTICE:
    "A schema cannot be edited after it is created. To change one, archive it and create a new one.",
  NAME_LABEL: "Schema name",
  DESCRIPTION_LABEL: "Description (optional)",
  GLOBAL_LABEL: "Make this a global schema",
  GLOBAL_HINT:
    "Global schemas can be used in every project. Only admins can create or archive them.",
  ADD_FIELD: "Add field",
  ARCHIVE_TITLE: "Archive this schema?",
  ARCHIVE_CONFIRM: "Archive",
  fieldNumber: (position: number) => `Field ${position}`,
  removeField: (position: number) => `Remove field ${position}`,
  viewDetailsOf: (name: string) => `View details of ${name}`,
  archiveLabel: (name: string) => `Archive ${name}`,
  archiveWarning: (name: string) =>
    `"${name}" will no longer be available for new imports. This cannot be undone.`,
} as const;

export const TABLE_MESSAGES = {
  ROWS_PER_PAGE: "Rows per page",
} as const;

export const IMPORT_STATUS_LABELS: Record<ImportStatus, string> = {
  UPLOADING: "Uploading",
  QUEUED: "Queued",
  PROCESSING: "Processing",
  COMPLETED: "Completed",
  FAILED: "Failed",
  CANCELLED: "Cancelled",
};

export const FILE_INPUT_MESSAGES = {
  CHOOSE: "Choose file",
  CHANGE: "Change file",
  NONE_SELECTED: "No file selected",
} as const;

export const IMPORTS_MESSAGES = {
  INTRO: "Upload a CSV file and it will be validated against a schema, then imported.",
  UPLOAD: "Upload file",
  TABLE_LABEL: "Import history",
  EMPTY: "No files have been imported into this project yet.",
  EMPTY_FOR_STATUS: "No imports with this status.",
  STATUS_FILTER: "Status",
  ALL_STATUSES: "All statuses",
  COLUMN_FILE: "File",
  COLUMN_SCHEMA: "Schema",
  COLUMN_STATUS: "Status",
  COLUMN_PROCESSED: "Processed",
  COLUMN_SUCCESSFUL: "Successful",
  COLUMN_FAILED: "Failed",
  COLUMN_DUPLICATES: "Duplicates",
  COLUMN_UPLOADED_BY: "Uploaded by",
  COLUMN_UPLOADED: "Uploaded",
  UPLOAD_TITLE: "Upload a file",
  FILE_LABEL: "File",
  FILE_HINT: "CSV only, up to 2 GB. The first row must be the column names.",
  SCHEMA_LABEL: "Schema",
  SCHEMA_HINT: "The file's columns are checked against this schema.",
  NO_SCHEMAS: "This project has no schemas yet. Create one in the Schemas tab first.",
  UPLOAD_SUBMIT: "Upload and import",
  CANCEL_UPLOAD: "Cancel upload",
  STEP_PREPARING: "Preparing upload…",
  STEP_STARTING: "Starting import…",
  UPLOAD_CANCELLED: "Upload cancelled.",
  uploadingPercent: (percent: number) => `Uploading… ${percent}%`,
} as const;

export const NOT_FOUND_MESSAGES = {
  CODE: "404",
  TITLE: "Page not found",
  DESCRIPTION: "The page you are looking for does not exist or has moved.",
} as const;
