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

export interface UpdateProfileInput {
  name: string;
  email: string;
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}

// confirmNewPassword exists only in the form; it is never sent to the API.
export interface ChangePasswordFormValues extends ChangePasswordInput {
  confirmNewPassword: string;
}

// Admin-only: at least one of the two must be present.
export interface UpdateUserInput {
  role?: Role;
  isActive?: boolean;
}

export interface UpdateUserVariables {
  id: string;
  input: UpdateUserInput;
}
