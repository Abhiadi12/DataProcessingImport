import {
  Prisma,
  type PrismaClient,
  type Project,
  type ProjectMember,
  type User,
} from "@prisma/client";
import { PROJECT_MESSAGES } from "../../constants/index.js";
import { ConflictError } from "../../errors/conflict.error.js";
import { NotFoundError } from "../../errors/not-found.error.js";

export interface CreateProjectData {
  name: string;
  description?: string;
}

export interface UpdateProjectData {
  name?: string;
  description?: string;
}

export interface ListProjectsParams {
  skip: number;
  take: number;
}

export interface ProjectMemberWithUser extends ProjectMember {
  user: User;
}

export interface ListMembersResult {
  members: ProjectMemberWithUser[];
  total: number;
}

export interface ListProjectsResult {
  projects: Project[];
  total: number;
}

export class ProjectRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(data: CreateProjectData, creatorId: string): Promise<Project> {
    return this.prisma.$transaction(async (tx) => {
      const project = await tx.project.create({ data });
      await tx.projectMember.create({
        data: { projectId: project.id, userId: creatorId },
      });
      return project;
    });
  }

  async findById(id: string): Promise<Project | null> {
    return this.prisma.project.findUnique({ where: { id } });
  }

  async list({ skip, take }: ListProjectsParams): Promise<ListProjectsResult> {
    const [projects, total] = await this.prisma.$transaction([
      this.prisma.project.findMany({ skip, take, orderBy: { createdAt: "desc" } }),
      this.prisma.project.count(),
    ]);
    return { projects, total };
  }

  //INFO: List project for specific user
  async listForMember(
    userId: string,
    { skip, take }: ListProjectsParams,
  ): Promise<ListProjectsResult> {
    const where = { members: { some: { userId } } };
    const [projects, total] = await this.prisma.$transaction([
      this.prisma.project.findMany({ where, skip, take, orderBy: { createdAt: "desc" } }),
      this.prisma.project.count({ where }),
    ]);
    return { projects, total };
  }

  async isMember(projectId: string, userId: string): Promise<boolean> {
    const membership = await this.prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId } },
      select: { id: true },
    });
    return membership !== null;
  }

  async update(id: string, data: UpdateProjectData): Promise<Project> {
    try {
      return await this.prisma.project.update({ where: { id }, data });
    } catch (error) {
      throw toDomainError(error);
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.prisma.project.delete({ where: { id } });
    } catch (error) {
      throw toDomainError(error);
    }
  }

  async listMembers(
    projectId: string,
    { skip, take }: ListProjectsParams,
  ): Promise<ListMembersResult> {
    const where = { projectId };
    const [members, total] = await this.prisma.$transaction([
      this.prisma.projectMember.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "asc" },
        include: { user: true },
      }),
      this.prisma.projectMember.count({ where }),
    ]);
    return { members, total };
  }

  async addMember(projectId: string, userId: string): Promise<ProjectMemberWithUser> {
    try {
      return await this.prisma.projectMember.create({
        data: { projectId, userId },
        include: { user: true },
      });
    } catch (error) {
      throw toMemberDomainError(error);
    }
  }

  // The count and the delete run in one transaction so the last member can't
  // slip out between the check and the write.
  async removeMember(projectId: string, userId: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const remaining = await tx.projectMember.count({ where: { projectId } });
      if (remaining <= 1) {
        throw new ConflictError(PROJECT_MESSAGES.LAST_MEMBER);
      }

      const { count } = await tx.projectMember.deleteMany({ where: { projectId, userId } });
      if (count === 0) {
        throw new NotFoundError(PROJECT_MESSAGES.TARGET_NOT_A_MEMBER);
      }
    });
  }
}

function toMemberDomainError(error: unknown): unknown {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    // P2002 = the (project_id, user_id) unique index rejected a duplicate.
    if (error.code === "P2002") {
      return new ConflictError(PROJECT_MESSAGES.ALREADY_A_MEMBER);
    }
    // P2003 = foreign key violation: the project or user doesn't exist.
    if (error.code === "P2003") {
      return new NotFoundError(PROJECT_MESSAGES.NOT_FOUND);
    }
  }
  return error;
}

function toDomainError(error: unknown): unknown {
  // P2025 = the row to update or delete doesn't exist.
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
    return new NotFoundError(PROJECT_MESSAGES.NOT_FOUND);
  }
  return error;
}
