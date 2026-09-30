export type Role = "ADMIN" | "MANAGER" | "MEMBER";

//INFO: Dates arrive as ISO strings over JSON, not Date objects.
export interface PublicUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
