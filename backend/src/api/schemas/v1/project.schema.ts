import { z } from "zod";
import {
  EMAIL_MAX_LENGTH,
  PROJECT_DESCRIPTION_MAX_LENGTH,
  PROJECT_NAME_MAX_LENGTH,
  VALIDATION_MESSAGES,
} from "../../../constants/index.js";
import { paginationQuerySchema } from "./pagination.schema.js";

export const createProjectSchema = z.object({
  name: z.string().trim().min(1).max(PROJECT_NAME_MAX_LENGTH),
  description: z.string().trim().max(PROJECT_DESCRIPTION_MAX_LENGTH).optional(),
});

export const updateProjectSchema = z
  .object({
    name: z.string().trim().min(1).max(PROJECT_NAME_MAX_LENGTH).optional(),
    description: z.string().trim().max(PROJECT_DESCRIPTION_MAX_LENGTH).optional(),
  })
  .refine((body) => body.name !== undefined || body.description !== undefined, {
    message: VALIDATION_MESSAGES.PROVIDE_NAME_OR_DESCRIPTION,
  });

// Same page/limit rules as every other list endpoint.
export const listProjectsQuerySchema = paginationQuerySchema;

export const projectIdParamSchema = z.object({
  id: z.string().uuid(),
});

export type ListProjectsQuery = z.infer<typeof listProjectsQuerySchema>;
export type ProjectIdParam = z.infer<typeof projectIdParamSchema>;

export const addProjectMemberSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(EMAIL_MAX_LENGTH),
});

export const projectMemberParamsSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
});

export type ProjectMemberParams = z.infer<typeof projectMemberParamsSchema>;
