import { NAME_MAX_LENGTH, PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from "./validation.constants";

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

export const HOME_MESSAGES = {
  TITLE: "Welcome",
  DESCRIPTION: "Your projects and imports will appear here.",
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
} as const;

export const NOT_FOUND_MESSAGES = {
  CODE: "404",
  TITLE: "Page not found",
  DESCRIPTION: "The page you are looking for does not exist or has moved.",
} as const;
