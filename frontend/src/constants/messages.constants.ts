export const APP_MESSAGES = {
  NAME: "Data Import Platform",
  TAGLINE: "Upload, validate and process large CSV and JSON files.",
  ROOT_ELEMENT_MISSING: "Root element #root not found in index.html",
} as const;

export const COMMON_MESSAGES = {
  UNKNOWN_ERROR: "Something went wrong. Please try again.",
  NETWORK_ERROR: "Unable to reach the server. Check your connection.",
  BACK_HOME: "Back to home",
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

export const NOT_FOUND_MESSAGES = {
  CODE: "404",
  TITLE: "Page not found",
  DESCRIPTION: "The page you are looking for does not exist or has moved.",
} as const;
