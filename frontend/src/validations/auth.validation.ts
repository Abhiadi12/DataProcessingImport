import { z } from "zod";
import {
  EMAIL_MAX_LENGTH,
  NAME_MAX_LENGTH,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  VALIDATION_MESSAGES,
} from "@/constants";
import type { LoginInput, RegisterFormValues } from "@/types";

// Trim first, then validate — a padded but otherwise valid email must pass.
// (The backend also lowercases it.)
export const emailSchema = z
  .string()
  .trim()
  .pipe(
    z
      .email(VALIDATION_MESSAGES.EMAIL_INVALID)
      .max(EMAIL_MAX_LENGTH, VALIDATION_MESSAGES.EMAIL_INVALID),
  );

export const nameSchema = z
  .string()
  .trim()
  .min(1, VALIDATION_MESSAGES.NAME_REQUIRED)
  .max(NAME_MAX_LENGTH, VALIDATION_MESSAGES.NAME_TOO_LONG);

// Shared by register and change-password, like the backend's newPasswordSchema.
export const newPasswordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, VALIDATION_MESSAGES.PASSWORD_TOO_SHORT)
  .max(PASSWORD_MAX_LENGTH, VALIDATION_MESSAGES.PASSWORD_TOO_LONG);

// Login only checks the password is present: length rules belong to choosing
// a password, and applying them here would reveal them to anyone guessing.
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, VALIDATION_MESSAGES.PASSWORD_REQUIRED),
}) satisfies z.ZodType<LoginInput>;

export const registerSchema = z
  .object({
    name: nameSchema,
    email: emailSchema,
    password: newPasswordSchema,
    confirmPassword: z.string(),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ["confirmPassword"],
    message: VALIDATION_MESSAGES.PASSWORDS_DO_NOT_MATCH,
  }) satisfies z.ZodType<RegisterFormValues>;
