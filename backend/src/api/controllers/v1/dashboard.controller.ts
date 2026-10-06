import type { NextFunction, Request, Response } from "express";
import { AUTH_MESSAGES, DASHBOARD_MESSAGES } from "../../../constants/index.js";
import { container } from "../../../container.js";
import { UnauthorizedError } from "../../../errors/unauthorized.error.js";
import { ok } from "../../../utils/create-response.js";

export async function getDashboard(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new UnauthorizedError(AUTH_MESSAGES.NOT_AUTHENTICATED);
    const dashboard = await container.dashboardService.getDashboard(req.user);
    res.json(ok(DASHBOARD_MESSAGES.FETCHED, dashboard));
  } catch (error) {
    next(error);
  }
}

export async function getAdminDashboard(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    // Role is enforced by requireRole(Role.ADMIN) on the route.
    const dashboard = await container.dashboardService.getAdminDashboard();
    res.json(ok(DASHBOARD_MESSAGES.ADMIN_FETCHED, dashboard));
  } catch (error) {
    next(error);
  }
}
