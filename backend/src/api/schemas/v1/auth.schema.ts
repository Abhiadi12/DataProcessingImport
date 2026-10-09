import { z } from "zod";
import {
  EMAIL_MAX_LENGTH,
  NAME_MAX_LENGTH,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  VALIDATION_MESSAGES,
} from "../../../constants/index.js";

export const newPasswordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, VALIDATION_MESSAGES.PASSWORD_TOO_SHORT)
  .max(PASSWORD_MAX_LENGTH, VALIDATION_MESSAGES.PASSWORD_TOO_LONG);

export const registerSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(EMAIL_MAX_LENGTH),
  password: newPasswordSchema,
  name: z.string().trim().min(1).max(NAME_MAX_LENGTH),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1, "Password is required"),
});
