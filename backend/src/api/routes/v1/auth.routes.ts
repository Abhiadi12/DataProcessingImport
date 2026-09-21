import { Router } from "express";
import { v1AuthController } from "../../controllers/index.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { registerSchema } from "../../schemas/v1/auth.schema.js";

export const authRouter = Router();

authRouter.post("/register", validate({ body: registerSchema }), v1AuthController.register);
