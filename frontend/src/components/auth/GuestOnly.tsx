import { Navigate, Outlet, useLocation } from "react-router";
import { PageLoader } from "@/components/common/PageLoader";
import { AUTH_STATUS, ROUTES } from "@/constants";
import { useAppSelector } from "@/hooks/redux.hooks";
import { selectAuthStatus } from "@/store/slices/auth.slice";
import type { RedirectState } from "@/types";

//INFO: Guard for login/register: a signed-in user is sent back to the page that
// redirected them here (or home). This is also what completes a login — once
// setSession runs, this guard redirects.
export function GuestOnly() {
  const status = useAppSelector(selectAuthStatus);
  const location = useLocation();

  if (status === AUTH_STATUS.CHECKING) {
    return <PageLoader fullScreen />;
  }

  if (status === AUTH_STATUS.AUTHENTICATED) {
    const from = (location.state as RedirectState | null)?.from ?? ROUTES.HOME;
    return <Navigate to={from} replace />;
  }

  return <Outlet />;
}
