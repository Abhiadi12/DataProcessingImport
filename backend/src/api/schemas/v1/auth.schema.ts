import { z } from "zod";

export const newPasswordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(24, "Password must be at most 24 characters");

export const registerSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  password: newPasswordSchema,
  name: z.string().trim().min(1).max(100),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1, "Password is required"),
});
