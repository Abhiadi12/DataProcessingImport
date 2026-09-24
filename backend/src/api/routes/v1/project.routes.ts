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
  requireProjectAccess,
  v1ProjectController.getProjectById,
);

// Membership first, then role: a MANAGER who isn't a member gets 404, not 403.
projectRouter.patch(
  "/:id",
  authenticate,
  validate({ params: projectIdParamSchema, body: updateProjectSchema }),
  requireProjectAccess,
  requireRole(Role.MANAGER),
  v1ProjectController.updateProject,
);

// Same rule as PATCH: a MANAGER who belongs to the project, or an ADMIN.
projectRouter.delete(
  "/:id",
  authenticate,
  validate({ params: projectIdParamSchema }),
  requireProjectAccess,
  requireRole(Role.MANAGER),
  v1ProjectController.deleteProject,
);
