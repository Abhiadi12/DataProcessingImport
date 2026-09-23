import type { Role } from "@prisma/client";

//INFO: Roles are ranked, so a route asking for MANAGER also lets an ADMIN through.
export const RANK: Record<Role, number> = { MEMBER: 1, MANAGER: 2, ADMIN: 3 };
