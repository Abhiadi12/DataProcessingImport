import { Role } from "@prisma/client";
import { Router } from "express";
import { v1DashboardController } from "../../controllers/index.js";
import { authenticate } from "../../middlewares/authenticate.middleware.js";
import { requireRole } from "../../middlewares/require-role.middleware.js";

export const dashboardRouter = Router();

dashboardRouter.get("/", authenticate, v1DashboardController.getDashboard);

export const adminDashboardRouter = Router();

adminDashboardRouter.get(
  "/dashboard",
  authenticate,
  requireRole(Role.ADMIN),
  v1DashboardController.getAdminDashboard,
);
