import { Route, Routes } from "react-router";
import { GuestOnly } from "@/components/auth/GuestOnly";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { AppLayout } from "@/components/common/AppLayout";
import { AppSnackbar } from "@/components/common/AppSnackbar";
import { ROLE, ROUTES } from "@/constants";
import { useRestoreSession } from "@/hooks/useRestoreSession";
import { HomePage } from "@/pages/HomePage";
import { LoginPage } from "@/pages/LoginPage";
import { NotFoundPage } from "@/pages/NotFoundPage";
import { ProfilePage } from "@/pages/ProfilePage";
import { RegisterPage } from "@/pages/RegisterPage";
import { UsersPage } from "@/pages/UsersPage";

export function App() {
  useRestoreSession();

  return (
    <>
      <Routes>
        <Route element={<GuestOnly />}>
          <Route path={ROUTES.LOGIN} element={<LoginPage />} />
          <Route path={ROUTES.REGISTER} element={<RegisterPage />} />
        </Route>

        <Route element={<AppLayout />}>
          <Route element={<RequireAuth />}>
            <Route path={ROUTES.HOME} element={<HomePage />} />
            <Route path={ROUTES.PROFILE} element={<ProfilePage />} />
            <Route element={<RequireAuth minimumRole={ROLE.ADMIN} />}>
              <Route path={ROUTES.USERS} element={<UsersPage />} />
            </Route>
          </Route>
          <Route path={ROUTES.NOT_FOUND} element={<NotFoundPage />} />
        </Route>
      </Routes>
      <AppSnackbar />
    </>
  );
}
