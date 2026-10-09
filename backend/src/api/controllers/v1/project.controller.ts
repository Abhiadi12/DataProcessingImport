import type { NextFunction, Request, Response } from "express";
import { AUTH_MESSAGES, PROJECT_MESSAGES } from "../../../constants/index.js";
import { container } from "../../../container.js";
import { UnauthorizedError } from "../../../errors/unauthorized.error.js";
import { ok } from "../../../utils/create-response.js";
import type {
  ListProjectsQuery,
  ProjectIdParam,
  ProjectMemberParams,
} from "../../schemas/v1/project.schema.js";

export async function createProject(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError(AUTH_MESSAGES.NOT_AUTHENTICATED);
    const project = await container.projectService.createProject(req.user.id, req.body);
    res.status(201).json(ok(PROJECT_MESSAGES.CREATED, project));
  } catch (error) {
    next(error);
  }
}

export async function listProjects(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError(AUTH_MESSAGES.NOT_AUTHENTICATED);
    const query = req.validatedQuery as ListProjectsQuery;
    const projects = await container.projectService.listProjects(req.user, query);
    res.json(ok(PROJECT_MESSAGES.LIST_FETCHED, projects));
  } catch (error) {
    next(error);
  }
}

export async function getProjectById(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { id } = req.validatedParams as ProjectIdParam;
    const project = await container.projectService.getProject(id);
    res.json(ok(PROJECT_MESSAGES.FETCHED, project));
  } catch (error) {
    next(error);
  }
}

export async function updateProject(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { id } = req.validatedParams as ProjectIdParam;
    const project = await container.projectService.updateProject(id, req.body);
    res.json(ok(PROJECT_MESSAGES.UPDATED, project));
  } catch (error) {
    next(error);
  }
}

export async function deleteProject(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { id } = req.validatedParams as ProjectIdParam;
    await container.projectService.deleteProject(id);
    res.json(ok(PROJECT_MESSAGES.DELETED));
  } catch (error) {
    next(error);
  }
}

export async function listProjectMembers(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { id } = req.validatedParams as ProjectIdParam;
    const query = req.validatedQuery as ListProjectsQuery;
    const members = await container.projectService.listMembers(id, query);
    res.json(ok(PROJECT_MESSAGES.MEMBERS_FETCHED, members));
  } catch (error) {
    next(error);
  }
}

export async function addProjectMember(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { id } = req.validatedParams as ProjectIdParam;
    const member = await container.projectService.addMember(id, req.body.email);
    res.status(201).json(ok(PROJECT_MESSAGES.MEMBER_ADDED, member));
  } catch (error) {
    next(error);
  }
}

export async function removeProjectMember(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { id, userId } = req.validatedParams as ProjectMemberParams;
    await container.projectService.removeMember(id, userId);
    res.json(ok(PROJECT_MESSAGES.MEMBER_REMOVED));
  } catch (error) {
    next(error);
  }
}
