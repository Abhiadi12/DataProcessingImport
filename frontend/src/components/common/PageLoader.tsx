import CircularProgress from "@mui/material/CircularProgress";
import { LOADER_MESSAGES } from "@/constants";
import type { PageLoaderProps } from "@/types";

// fullScreen for use outside AppLayout (e.g. before the header exists);
// the default fits the layout's content area.
export function PageLoader({ fullScreen = false }: PageLoaderProps) {
  return (
    <div
      className={
        fullScreen
          ? "flex min-h-screen items-center justify-center"
          : "flex items-center justify-center py-24"
      }
    >
      <CircularProgress aria-label={LOADER_MESSAGES.LOADING} />
    </div>
  );
}
