import type { Role } from "@prisma/client";

// Roles are ranked, so a route asking for MANAGER also lets an ADMIN through.
// The role names themselves come from Prisma's generated `Role` enum — use
// `Role.ADMIN` rather than the string "ADMIN" so a typo fails to compile.
export const ROLE_RANK: Record<Role, number> = { MEMBER: 1, MANAGER: 2, ADMIN: 3 };
