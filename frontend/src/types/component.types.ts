import type { TextFieldProps } from "@mui/material/TextField";
import type { ReactNode } from "react";
import type { Role } from "./user.types";

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
