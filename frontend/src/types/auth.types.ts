import type { PublicUser } from "./user.types";

//INFO: The refresh token never appears here: the backend keeps it in an httpOnly
// cookie that JavaScript cannot read.
export interface AuthSession {
  accessToken: string;
  tokenType: "Bearer";
  expiresIn: number;
  user: PublicUser;
}

export interface AuthState {
  accessToken: string | null;
  user: PublicUser | null;
}
