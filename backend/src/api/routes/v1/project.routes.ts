import { Role } from "@prisma/client";
import { Router } from "express";
import { v1ProjectController } from "../../controllers/index.js";
import { authenticate } from "../../middlewares/authenticate.middleware.js";
import { requireProjectAccess } from "../../middlewares/require-project-access.middleware.js";
import { requireRole } from "../../middlewares/require-role.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import {
  createProjectSchema,
  listProjectsQuerySchema,
  projectIdParamSchema,
  updateProjectSchema,
  addProjectMemberSchema,
  projectMemberParamsSchema,
} from "../../schemas/v1/project.schema.js";

export const projectRouter = Router();

projectRouter.post(
  "/",
  authenticate,
  requireRole(Role.MANAGER),
  validate({ body: createProjectSchema }),
  v1ProjectController.createProject,
);

projectRouter.get(
  "/",
  authenticate,
  validate({ query: listProjectsQuerySchema }),
  v1ProjectController.listProjects,
);

projectRouter.get(
  "/:id",
  authenticate,
  validate({ params: projectIdParamSchema }),
  requireProjectAccess(),
  v1ProjectController.getProjectById,
);

projectRouter.patch(
  "/:id",
  authenticate,
  validate({ params: projectIdParamSchema, body: updateProjectSchema }),
  requireProjectAccess(),
  requireRole(Role.MANAGER),
  v1ProjectController.updateProject,
);

projectRouter.delete(
  "/:id",
  authenticate,
  validate({ params: projectIdParamSchema }),
  requireProjectAccess(),
  requireRole(Role.MANAGER),
  v1ProjectController.deleteProject,
);

projectRouter.get(
  "/:id/members",
  authenticate,
  validate({ params: projectIdParamSchema, query: listProjectsQuerySchema }),
  requireProjectAccess(Role.MANAGER),
  v1ProjectController.listProjectMembers,
);

projectRouter.post(
  "/:id/members",
  authenticate,
  validate({ params: projectIdParamSchema, body: addProjectMemberSchema }),
  requireProjectAccess(),
  requireRole(Role.MANAGER),
  v1ProjectController.addProjectMember,
);

projectRouter.delete(
  "/:id/members/:userId",
  authenticate,
  validate({ params: projectMemberParamsSchema }),
  requireProjectAccess(),
  requireRole(Role.MANAGER),
  v1ProjectController.removeProjectMember,
);
