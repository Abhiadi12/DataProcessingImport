import type { PublicUser } from "@/types";

export const mockUser: PublicUser = {
  id: "8f14e45f-ceea-4e7a-9b1d-2c3d4e5f6a7b",
  email: "jane@example.com",
  name: "Jane Doe",
  role: "MEMBER",
  isActive: true,
  createdAt: "2026-09-01T10:00:00.000Z",
  updatedAt: "2026-09-01T10:00:00.000Z",
};

export const mockAdminUser: PublicUser = {
  id: "1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed",
  email: "admin@example.com",
  name: "Ada Admin",
  role: "ADMIN",
  isActive: true,
  createdAt: "2026-08-15T12:00:00.000Z",
  updatedAt: "2026-08-15T12:00:00.000Z",
};

export const mockManagerUser: PublicUser = {
  id: "6ec0bd7f-11c0-43da-975e-2a8ad9ebae0b",
  email: "manny@example.com",
  name: "Manny Manager",
  role: "MANAGER",
  isActive: false,
  createdAt: "2026-09-10T12:00:00.000Z",
  updatedAt: "2026-09-20T12:00:00.000Z",
};
