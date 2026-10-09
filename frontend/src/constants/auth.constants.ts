import type { AuthStatus } from "@/types";

export const AUTH_STATUS = {
  CHECKING: "checking",
  AUTHENTICATED: "authenticated",
  ANONYMOUS: "anonymous",
} as const satisfies Record<string, AuthStatus>;
