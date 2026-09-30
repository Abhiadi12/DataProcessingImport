import type { Role } from "@/types";

export const ROLE = {
  ADMIN: "ADMIN",
  MANAGER: "MANAGER",
  MEMBER: "MEMBER",
} as const satisfies Record<Role, Role>;

export const ROLE_RANK: Record<Role, number> = {
  MEMBER: 1,
  MANAGER: 2,
  ADMIN: 3,
};
