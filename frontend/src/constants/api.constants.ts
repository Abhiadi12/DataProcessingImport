const DEFAULT_API_BASE_URL = "/api/v1";

// Relative on purpose: the API is served from the same origin (Vite proxy in
// dev, Nginx in prod), which keeps the refresh cookie SameSite=Lax.
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL;

// /health is mounted outside /api/v1, so it is requested against the page origin.
export const API_ROOT_URL = "";

export const API_TIMEOUT_MS = 30_000;

export const API_ENDPOINTS = {
  HEALTH: "/health",
  AUTH: {
    REGISTER: "/auth/register",
    LOGIN: "/auth/login",
    REFRESH: "/auth/refresh",
    LOGOUT: "/auth/logout",
    LOGOUT_ALL: "/auth/logout-all",
  },
  USERS: {
    ME: "/users/me",
    MY_PASSWORD: "/users/me/password",
    LIST: "/users",
    byId: (id: string) => `/users/${id}`,
  },
  PROJECTS: {
    LIST: "/projects",
    byId: (id: string) => `/projects/${id}`,
    members: (id: string) => `/projects/${id}/members`,
    member: (id: string, userId: string) => `/projects/${id}/members/${userId}`,
    // A project's own schemas plus every global one.
    importSchemas: (id: string) => `/projects/${id}/import-schemas`,
    // POST prepares an upload (step 1); GET lists the project's imports.
    imports: (id: string) => `/projects/${id}/imports`,
  },
  IMPORT_SCHEMAS: {
    GLOBAL: "/import-schemas",
    byId: (id: string) => `/import-schemas/${id}`,
  },
  IMPORTS: {
    start: (id: string) => `/imports/${id}/start`,
    byId: (id: string) => `/imports/${id}`,
    progress: (id: string) => `/imports/${id}/progress`,
    cancel: (id: string) => `/imports/${id}/cancel`,
    retry: (id: string) => `/imports/${id}/retry`,
    download: (id: string) => `/imports/${id}/download`,
    errorReport: (id: string) => `/imports/${id}/error-report`,
  },
} as const;

export const NO_REFRESH_ENDPOINTS: readonly string[] = [
  API_ENDPOINTS.AUTH.REGISTER,
  API_ENDPOINTS.AUTH.LOGIN,
  API_ENDPOINTS.AUTH.REFRESH,
  API_ENDPOINTS.AUTH.LOGOUT,
];

export const HTTP_STATUS = {
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
} as const;
