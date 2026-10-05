import type { TextFieldProps } from "@mui/material/TextField";
import type { ReactNode } from "react";
import type { Project } from "./project.types";
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
  // Red confirm button, for deletes.
  destructive?: boolean;
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

export interface EmptyStateProps {
  title: string;
  description: string;
  // Optional button or link shown under the text.
  action?: ReactNode;
}

export interface ProjectCardProps {
  project: Project;
  // Managers and admins get the edit/delete menu.
  canManage: boolean;
  onEdit: (project: Project) => void;
  onDelete: (project: Project) => void;
}

export interface ProjectFormDialogProps {
  open: boolean;
  // null = create a new project; a project = edit it.
  project: Project | null;
  onClose: () => void;
}

export interface DeleteProjectDialogProps {
  // The dialog is open while this is set.
  project: Project | null;
  onClose: () => void;
  // Called after the project is gone (e.g. to leave its page).
  onDeleted?: (project: Project) => void;
}

export interface ProjectLoadErrorProps {
  error: unknown;
}

export interface MembersPanelProps {
  projectId: string;
  // Add/remove controls. Needs MANAGER+ *and* access to the project.
  canManage: boolean;
}

export interface AddMemberFormProps {
  projectId: string;
}

export interface NonMemberProjectViewProps {
  projectId: string;
  // The 403 from the project detail request, shown if there is nothing else
  // to show.
  error: unknown;
}
