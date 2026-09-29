import { Role } from "@prisma/client";
import { Router } from "express";
import { v1ImportSchemaController } from "../../controllers/index.js";
import { authenticate } from "../../middlewares/authenticate.middleware.js";
import { requireRole } from "../../middlewares/require-role.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import {
  createImportSchemaSchema,
  importSchemaIdParamSchema,
} from "../../schemas/v1/import-schema.schema.js";

export const importSchemaRouter = Router();

//INFO: Admin only , create a global import schemas
importSchemaRouter.post(
  "/",
  authenticate,
  requireRole(Role.ADMIN),
  validate({ body: createImportSchemaSchema }),
  v1ImportSchemaController.createGlobalImportSchema,
);

importSchemaRouter.get(
  "/:id",
  authenticate,
  validate({ params: importSchemaIdParamSchema }),
  v1ImportSchemaController.getImportSchemaById,
);

importSchemaRouter.delete(
  "/:id",
  authenticate,
  requireRole(Role.MANAGER),
  validate({ params: importSchemaIdParamSchema }),
  v1ImportSchemaController.archiveImportSchema,
);
