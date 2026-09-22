import { Router } from "express";
import { v1UserController } from "../../controllers/index.js";
import { authenticate } from "../../middlewares/authenticate.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { changePasswordSchema, updateProfileSchema } from "../../schemas/v1/user.schema.js";

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
