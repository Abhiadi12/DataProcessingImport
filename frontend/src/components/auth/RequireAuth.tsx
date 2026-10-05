import { Navigate, Outlet, useLocation } from "react-router";
import { PageLoader } from "@/components/common/PageLoader";
import { AUTH_STATUS, ROLE_RANK, ROUTES } from "@/constants";
import { useAppSelector } from "@/hooks/redux.hooks";
import { selectAuthStatus, selectCurrentUser } from "@/store/slices/auth.slice";
import type { RedirectState, RequireAuthProps } from "@/types";

export function RequireAuth({ minimumRole }: RequireAuthProps) {
  const status = useAppSelector(selectAuthStatus);
  const user = useAppSelector(selectCurrentUser);
  const location = useLocation();

  if (status === AUTH_STATUS.CHECKING) {
    return <PageLoader />;
  }

  if (!user) {
    const state: RedirectState = { from: location.pathname + location.search };
    return <Navigate to={ROUTES.LOGIN} replace state={state} />;
  }

  if (minimumRole && ROLE_RANK[user.role] < ROLE_RANK[minimumRole]) {
    return <Navigate to={ROUTES.HOME} replace />;
  }

  return <Outlet />;
}
