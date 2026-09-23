import { Role } from "@prisma/client";
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

export const listUsersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export const userIdParamSchema = z.object({
  id: z.string().uuid(),
});

//INFO: Admin-only schema for updating a user's role or active status.
export const updateUserSchema = z
  .object({
    role: z.nativeEnum(Role).optional(),
    isActive: z.boolean().optional(),
  })
  .refine((body) => body.role !== undefined || body.isActive !== undefined, {
    message: "Provide at least one of role or isActive",
  });

export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;
export type UserIdParam = z.infer<typeof userIdParamSchema>;
