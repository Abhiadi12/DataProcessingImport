import { z } from "zod";
import { newPasswordSchema } from "./auth.schema.js";

export const updateProfileSchema = z
  .object({
    name: z.string().trim().min(1).max(100).optional(),
    email: z.string().trim().toLowerCase().email().max(254).optional(),
  })
  .refine((body) => body.name !== undefined || body.email !== undefined, {
    message: "Provide at least one of name or email",
  });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: newPasswordSchema,
  })
  .refine((body) => body.newPassword !== body.currentPassword, {
    message: "New password must be different from the current password",
    path: ["newPassword"],
  });
