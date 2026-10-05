export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  REGISTER: "/register",
  PROFILE: "/profile",
  USERS: "/users",
  // Route pattern for <Route path>. Build real links with projectPath(id).
  PROJECT_DETAIL: "/projects/:id",
  NOT_FOUND: "*",
} as const;

export const projectPath = (id: string) => `/projects/${id}`;

// The project detail page keeps its open tab in the URL (?tab=schemas), so a
// reload or a shared link lands on the same tab.
export const PROJECT_TAB_PARAM = "tab";

export const PROJECT_TABS = {
  MEMBERS: "members",
  SCHEMAS: "schemas",
  IMPORTS: "imports",
} as const;
