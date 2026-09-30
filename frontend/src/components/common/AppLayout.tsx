import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import { Link as RouterLink, Outlet, useLocation } from "react-router";
import { APP_MESSAGES, ROUTES } from "@/constants";
import { ApiStatusChip } from "./ApiStatusChip";
import { ErrorBoundary } from "./ErrorBoundary";

export function AppLayout() {
  const { pathname } = useLocation();

  return (
    <div className="flex min-h-screen flex-col">
      <AppBar position="sticky" className="border-b border-slate-200">
        <Toolbar className="mx-auto w-full max-w-6xl gap-4">
          <Typography
            variant="h6"
            component={RouterLink}
            to={ROUTES.HOME}
            color="inherit"
            className="font-semibold no-underline"
          >
            {APP_MESSAGES.NAME}
          </Typography>
          <div className="ml-auto">
            <ApiStatusChip />
          </div>
        </Toolbar>
      </AppBar>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <ErrorBoundary key={pathname}>
          <Outlet />
        </ErrorBoundary>
      </main>
    </div>
  );
}
