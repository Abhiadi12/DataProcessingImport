import type { NextFunction, Request, Response } from "express";
import { container } from "../../../container.js";
import { ok } from "../../../utils/create-response.js";

export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await container.authService.register(req.body);
    res.status(201).json(ok("Registration successful", user));
  } catch (error) {
    next(error);
  }
}

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await container.authService.login(req.body);
    res.json(ok("Login successful", result));
  } catch (error) {
    next(error);
  }
}
