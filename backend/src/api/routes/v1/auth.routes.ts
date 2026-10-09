import { Router } from "express";
import { v1AuthController } from "../../controllers/index.js";
import { authenticate } from "../../middlewares/authenticate.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { loginSchema, registerSchema } from "../../schemas/v1/auth.schema.js";

export const authRouter = Router();

authRouter.post("/register", validate({ body: registerSchema }), v1AuthController.register);
authRouter.post("/login", validate({ body: loginSchema }), v1AuthController.login);
authRouter.post("/refresh", v1AuthController.refresh);
authRouter.post("/logout", v1AuthController.logout);
authRouter.post("/logout-all", authenticate, v1AuthController.logoutAll);
