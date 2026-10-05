import { ROLE_RANK } from "@/constants";
import type { PublicUser, Role } from "@/types";

// True when the user's role is at least `minimum` (MEMBER < MANAGER < ADMIN).
// For deciding what to show only — the API enforces the real rule.
export function hasRole(user: PublicUser | null, minimum: Role): boolean {
  return user !== null && ROLE_RANK[user.role] >= ROLE_RANK[minimum];
}
