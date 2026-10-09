import type { PublicUser } from "./user.types";

//INFO: The refresh token never appears here: the backend keeps it in an httpOnly
// cookie that JavaScript cannot read.
export interface AuthSession {
  accessToken: string;
  tokenType: "Bearer";
  expiresIn: number;
  user: PublicUser;
}

export type AuthStatus = "checking" | "authenticated" | "anonymous";

export interface AuthState {
  status: AuthStatus;
  accessToken: string | null;
  user: PublicUser | null;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

// confirmPassword exists only in the form; it is never sent to the API.
export interface RegisterFormValues extends RegisterInput {
  confirmPassword: string;
}
