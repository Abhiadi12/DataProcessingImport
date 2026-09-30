import { Router } from "express";
import { v1ImportController } from "../../controllers/index.js";
import { authenticate } from "../../middlewares/authenticate.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { importIdParamSchema } from "../../schemas/v1/import.schema.js";

/**
 * Flat routes, mounted at /imports.
 *
 * Not nested under /projects/:id because the client only holds an importId at
 * this point — making it re-send the projectId would be redundant and would let
 * the two disagree. `requireProjectAccess` therefore can't run here; membership
 * is enforced in ImportService once the row reveals the owning project.
 *
 * No requireRole: uploading is the core member action. The brief's rule is
 * "users should only access projects they belong to", which is about membership,
 * not seniority.
 */
export const importRouter = Router();

importRouter.post(
  "/:id/start",
  authenticate,
  validate({ params: importIdParamSchema }),
  v1ImportController.startImport,
);
