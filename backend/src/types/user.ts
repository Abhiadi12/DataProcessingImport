export interface User {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  isAdmin: boolean;
  createdAt: Date;
}

export type PublicUser = Omit<User, "passwordHash">;
