import AppBar from "@mui/material/AppBar";
import Button from "@mui/material/Button";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import { Link as RouterLink, NavLink, Outlet, useLocation } from "react-router";
import { UserMenu } from "@/components/user/UserMenu";
import { APP_MESSAGES, NAV_MESSAGES, ROLE, ROUTES } from "@/constants";
import { useAppSelector } from "@/hooks/redux.hooks";
import { selectCurrentUser } from "@/store/slices/auth.slice";
import { ApiStatusChip } from "./ApiStatusChip";
import { ErrorBoundary } from "./ErrorBoundary";

export function AppLayout() {
  const { pathname } = useLocation();
  const user = useAppSelector(selectCurrentUser);

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
          {user?.role === ROLE.ADMIN && (
            <Button component={NavLink} to={ROUTES.USERS} color="inherit">
              {NAV_MESSAGES.USERS}
            </Button>
          )}
          <div className="ml-auto flex items-center gap-3">
            <ApiStatusChip />
            <UserMenu />
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
