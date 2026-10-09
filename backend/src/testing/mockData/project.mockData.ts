import type { Project } from "@prisma/client";
import type { ProjectMemberWithUser } from "../../repositories/v1/project.repository.js";
import { mockUser, mockUserId } from "./user.mockData.js";

export const mockProjectId = "7c9e6679-7425-40de-944b-e07fc1f90ae7";

export const mockProject: Project = {
  id: mockProjectId,
  name: "Acme Import",
  description: "Customer data",
  createdAt: new Date("2026-01-01T00:00:00Z"),
  updatedAt: new Date("2026-01-01T00:00:00Z"),
};

export const mockCreateProjectInput = {
  name: mockProject.name,
  description: "Customer data",
};

export const mockProjectMember: ProjectMemberWithUser = {
  id: "5a2f8d1c-3b47-4e9a-8c61-0d7e2b4f9a33",
  projectId: mockProjectId,
  userId: mockUserId,
  createdAt: new Date("2026-01-02T00:00:00Z"),
  user: mockUser,
};
