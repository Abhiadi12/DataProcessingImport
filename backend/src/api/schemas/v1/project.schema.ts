import { z } from "zod";
import {
  DEFAULT_PAGE,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  PROJECT_DESCRIPTION_MAX_LENGTH,
  PROJECT_NAME_MAX_LENGTH,
  VALIDATION_MESSAGES,
} from "../../../constants/index.js";

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

export const listProjectsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(DEFAULT_PAGE),
  limit: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
});

export const projectIdParamSchema = z.object({
  id: z.string().uuid(),
});

export type ListProjectsQuery = z.infer<typeof listProjectsQuerySchema>;
export type ProjectIdParam = z.infer<typeof projectIdParamSchema>;
