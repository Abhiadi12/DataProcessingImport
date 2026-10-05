import type { Role } from "@/types";
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
  ROWS_PER_PAGE: "Rows per page",
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
  MEMBERS_PLACEHOLDER: "Member management for this project is coming next.",
  SCHEMAS_PLACEHOLDER: "Import schemas for this project are coming next.",
  IMPORTS_PLACEHOLDER: "File uploads and import history are coming next.",
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

export const NOT_FOUND_MESSAGES = {
  CODE: "404",
  TITLE: "Page not found",
  DESCRIPTION: "The page you are looking for does not exist or has moved.",
} as const;
