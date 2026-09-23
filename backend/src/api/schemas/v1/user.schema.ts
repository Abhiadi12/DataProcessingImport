import { Role } from "@prisma/client";
import { z } from "zod";
import {
  DEFAULT_PAGE,
  DEFAULT_PAGE_SIZE,
  EMAIL_MAX_LENGTH,
  MAX_PAGE_SIZE,
  NAME_MAX_LENGTH,
  VALIDATION_MESSAGES,
} from "../../../constants/index.js";
import { newPasswordSchema } from "./auth.schema.js";

export const updateProfileSchema = z
  .object({
    name: z.string().trim().min(1).max(NAME_MAX_LENGTH).optional(),
    email: z.string().trim().toLowerCase().email().max(EMAIL_MAX_LENGTH).optional(),
  })
  .refine((body) => body.name !== undefined || body.email !== undefined, {
    message: VALIDATION_MESSAGES.PROVIDE_NAME_OR_EMAIL,
  });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, VALIDATION_MESSAGES.CURRENT_PASSWORD_REQUIRED),
    newPassword: newPasswordSchema,
  })
  .refine((body) => body.newPassword !== body.currentPassword, {
    message: VALIDATION_MESSAGES.NEW_PASSWORD_MUST_DIFFER,
    path: ["newPassword"],
  });

export const listUsersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(DEFAULT_PAGE),
  limit: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
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
    message: VALIDATION_MESSAGES.PROVIDE_ROLE_OR_STATUS,
  });

export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;
export type UserIdParam = z.infer<typeof userIdParamSchema>;
