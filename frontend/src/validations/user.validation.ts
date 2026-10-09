import { z } from "zod";
import { VALIDATION_MESSAGES } from "@/constants";
import type { ChangePasswordFormValues, UpdateProfileInput } from "@/types";
import { emailSchema, nameSchema, newPasswordSchema } from "./auth.validation";

export const updateProfileSchema = z.object({
  name: nameSchema,
  email: emailSchema,
}) satisfies z.ZodType<UpdateProfileInput>;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, VALIDATION_MESSAGES.CURRENT_PASSWORD_REQUIRED),
    newPassword: newPasswordSchema,
    confirmNewPassword: z.string(),
  })
  .refine((values) => values.newPassword !== values.currentPassword, {
    path: ["newPassword"],
    message: VALIDATION_MESSAGES.NEW_PASSWORD_MUST_DIFFER,
  })
  .refine((values) => values.newPassword === values.confirmNewPassword, {
    path: ["confirmNewPassword"],
    message: VALIDATION_MESSAGES.PASSWORDS_DO_NOT_MATCH,
  }) satisfies z.ZodType<ChangePasswordFormValues>;
