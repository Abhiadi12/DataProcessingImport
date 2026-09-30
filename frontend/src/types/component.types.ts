import type { ReactNode } from "react";

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
