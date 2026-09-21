import { Router } from "express";
import { v1UserController } from "../../controllers/index.js";
import { authenticate } from "../../middlewares/authenticate.middleware.js";

export const userRouter = Router();

userRouter.get("/me", authenticate, v1UserController.getMe);
