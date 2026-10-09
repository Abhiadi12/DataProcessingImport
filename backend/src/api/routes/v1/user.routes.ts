import { Role } from "@prisma/client";
import { Router } from "express";
import { v1UserController } from "../../controllers/index.js";
import { authenticate } from "../../middlewares/authenticate.middleware.js";
import { requireRole } from "../../middlewares/require-role.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import {
  changePasswordSchema,
  listUsersQuerySchema,
  updateProfileSchema,
  updateUserSchema,
  userIdParamSchema,
} from "../../schemas/v1/user.schema.js";

export const userRouter = Router();

userRouter.get("/me", authenticate, v1UserController.getMe);
userRouter.patch(
  "/me",
  authenticate,
  validate({ body: updateProfileSchema }),
  v1UserController.updateMe,
);
userRouter.patch(
  "/me/password",
  authenticate,
  validate({ body: changePasswordSchema }),
  v1UserController.changeMyPassword,
);

userRouter.get(
  "/",
  authenticate,
  requireRole(Role.ADMIN),
  validate({ query: listUsersQuerySchema }),
  v1UserController.listUsers,
);
userRouter.get(
  "/:id",
  authenticate,
  requireRole(Role.ADMIN),
  validate({ params: userIdParamSchema }),
  v1UserController.getUserById,
);
userRouter.patch(
  "/:id",
  authenticate,
  requireRole(Role.ADMIN),
  validate({ params: userIdParamSchema, body: updateUserSchema }),
  v1UserController.updateUser,
);
