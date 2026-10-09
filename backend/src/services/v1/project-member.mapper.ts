import type { Role } from "@prisma/client";
import type { ProjectMemberWithUser } from "../../repositories/v1/project.repository.js";

export interface ProjectMemberView {
  userId: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  joinedAt: Date;
}

export function toProjectMemberView(member: ProjectMemberWithUser): ProjectMemberView {
  return {
    userId: member.user.id,
    name: member.user.name,
    email: member.user.email,
    role: member.user.role,
    isActive: member.user.isActive,
    joinedAt: member.createdAt,
  };
}
