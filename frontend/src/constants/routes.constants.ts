export const ROUTES = {
  HOME: "/",
  DASHBOARD: "/dashboard",
  ADMIN_DASHBOARD: "/admin/dashboard",
  LOGIN: "/login",
  REGISTER: "/register",
  PROFILE: "/profile",
  USERS: "/users",
  // Route pattern for <Route path>. Build real links with projectPath(id).
  PROJECT_DETAIL: "/projects/:id",
  // Route pattern. Build real links with importPath(id).
  IMPORT_DETAIL: "/imports/:id",
  NOT_FOUND: "*",
} as const;

export const projectPath = (id: string) => `/projects/${id}`;

export const importPath = (id: string) => `/imports/${id}`;

export const PROJECT_TAB_PARAM = "tab";

export const PROJECT_TABS = {
  MEMBERS: "members",
  SCHEMAS: "schemas",
  IMPORTS: "imports",
} as const;

export const projectImportsPath = (projectId: string) =>
  `${projectPath(projectId)}?${PROJECT_TAB_PARAM}=${PROJECT_TABS.IMPORTS}`;
