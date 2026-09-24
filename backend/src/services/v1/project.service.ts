import { Role, type Project } from "@prisma/client";
import { PROJECT_MESSAGES } from "../../constants/index.js";
import { NotFoundError } from "../../errors/not-found.error.js";
import type {
  CreateProjectData,
  ProjectRepository,
  UpdateProjectData,
} from "../../repositories/v1/project.repository.js";
import type { Paginated } from "../../types/pagination.js";
import type { AuthenticatedUser } from "./auth.service.js";

export type CreateProjectInput = CreateProjectData;
export type UpdateProjectInput = UpdateProjectData;

export interface ListProjectsInput {
  page: number;
  limit: number;
}

export class ProjectService {
  constructor(private readonly projectRepository: ProjectRepository) {}

  createProject(creatorId: string, input: CreateProjectInput): Promise<Project> {
    return this.projectRepository.create(input, creatorId);
  }

  async listProjects(
    user: AuthenticatedUser,
    { page, limit }: ListProjectsInput,
  ): Promise<Paginated<Project>> {
    const params = { skip: (page - 1) * limit, take: limit };
    const { projects, total } =
      user.role === Role.ADMIN
        ? await this.projectRepository.list(params)
        : await this.projectRepository.listForMember(user.id, params);

    return { items: projects, page, limit, total, totalPages: Math.ceil(total / limit) };
  }

  isMember(projectId: string, userId: string): Promise<boolean> {
    return this.projectRepository.isMember(projectId, userId);
  }

  async getProject(id: string): Promise<Project> {
    const project = await this.projectRepository.findById(id);
    if (!project) {
      throw new NotFoundError(PROJECT_MESSAGES.NOT_FOUND);
    }
    return project;
  }

  updateProject(id: string, input: UpdateProjectInput): Promise<Project> {
    return this.projectRepository.update(id, input);
  }

  deleteProject(id: string): Promise<void> {
    return this.projectRepository.delete(id);
  }
}
