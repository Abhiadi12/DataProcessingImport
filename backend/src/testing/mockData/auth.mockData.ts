import { mockPassword, mockUser } from "./user.mockData.js";

export const mockRegisterInput = {
  email: mockUser.email,
  password: mockPassword,
  name: mockUser.name,
};

export const mockLoginInput = {
  email: mockUser.email,
  password: mockPassword,
};

export const mockUnknownEmail = "nobody@example.com";
