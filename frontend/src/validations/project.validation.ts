import { z } from "zod";
import {
  PROJECT_DESCRIPTION_MAX_LENGTH,
  PROJECT_NAME_MAX_LENGTH,
  VALIDATION_MESSAGES,
} from "@/constants";
import type { AddMemberFormValues, ProjectFormValues } from "@/types";
import { emailSchema } from "./auth.validation";

export const projectSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, VALIDATION_MESSAGES.PROJECT_NAME_REQUIRED)
    .max(PROJECT_NAME_MAX_LENGTH, VALIDATION_MESSAGES.PROJECT_NAME_TOO_LONG),
  description: z
    .string()
    .trim()
    .max(PROJECT_DESCRIPTION_MAX_LENGTH, VALIDATION_MESSAGES.PROJECT_DESCRIPTION_TOO_LONG),
}) satisfies z.ZodType<ProjectFormValues>;

export const addMemberSchema = z.object({
  email: emailSchema,
}) satisfies z.ZodType<AddMemberFormValues>;
