import type { Role } from "./user.types";

// Dates arrive as ISO strings. description is null until one is set.
export interface Project {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

// The create/edit form. description is "" when left blank.
export interface ProjectFormValues {
  name: string;
  description: string;
}

export interface CreateProjectInput {
  name: string;
  description?: string;
}

export interface UpdateProjectVariables {
  id: string;
  input: ProjectFormValues;
}

// A user's membership of one project. role and isActive are the user's
// global values — there is no per-project role.
export interface ProjectMember {
  userId: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  joinedAt: string;
}

export interface AddMemberFormValues {
  email: string;
}

export interface AddMemberVariables {
  projectId: string;
  email: string;
}

export interface RemoveMemberVariables {
  projectId: string;
  userId: string;
}
