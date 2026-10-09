import { Router } from "express";
import { v1ImportController } from "../../controllers/index.js";
import { authenticate } from "../../middlewares/authenticate.middleware.js";
import { idempotency } from "../../middlewares/idempotency.middleware.js";
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

importRouter.get(
  "/:id",
  authenticate,
  validate({ params: importIdParamSchema }),
  v1ImportController.getImportById,
);

importRouter.get(
  "/:id/progress",
  authenticate,
  validate({ params: importIdParamSchema }),
  v1ImportController.getImportProgress,
);

importRouter.post(
  "/:id/cancel",
  authenticate,
  validate({ params: importIdParamSchema }),
  v1ImportController.cancelImport,
);

importRouter.get(
  "/:id/download",
  authenticate,
  validate({ params: importIdParamSchema }),
  v1ImportController.downloadImport,
);

importRouter.get(
  "/:id/error-report",
  authenticate,
  validate({ params: importIdParamSchema }),
  v1ImportController.downloadErrorReport,
);

//INFO: The retry endpoint is idempotent, so it can be safely retried if the client
importRouter.post(
  "/:id/retry",
  authenticate,
  validate({ params: importIdParamSchema }),
  idempotency("POST /api/v1/imports/:id/retry"),
  v1ImportController.retryImport,
);
