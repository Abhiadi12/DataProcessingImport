import type { TextFieldProps } from "@mui/material/TextField";
import type { ReactNode } from "react";
import type { PublicUser, Role, UpdateUserInput } from "./user.types";

export interface AppProvidersProps {
  children: ReactNode;
}

export interface ErrorBoundaryProps {
  children: ReactNode;
}

export interface ErrorBoundaryState {
  error: Error | null;
}

export interface ErrorFallbackProps {
  error: Error;
  onReset: () => void;
}

export interface PageLoaderProps {
  fullScreen?: boolean;
}

export interface RequireAuthProps {
  minimumRole?: Role;
}

export interface AuthCardProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}

export type PasswordFieldProps = Omit<TextFieldProps, "type">;

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export interface ProfileFormProps {
  user: PublicUser;
}

export interface UsersTableProps {
  users: PublicUser[];
  currentUserId: string;
  // Id of the user whose update is in flight, so only that row is disabled.
  updatingId: string | null;
  onView: (id: string) => void;
  onUpdate: (user: PublicUser, input: UpdateUserInput) => void;
}

export interface UserDetailsDialogProps {
  userId: string | null;
  onClose: () => void;
}

export interface DetailRowProps {
  label: string;
  children: ReactNode;
}
