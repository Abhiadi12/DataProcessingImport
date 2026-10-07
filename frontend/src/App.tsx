import { Route, Routes } from "react-router";
import { GuestOnly } from "@/components/auth/GuestOnly";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { AppLayout } from "@/components/common/AppLayout";
import { AppSnackbar } from "@/components/common/AppSnackbar";
import { ROLE, ROUTES } from "@/constants";
import { useRestoreSession } from "@/hooks/useRestoreSession";
import { DashboardPage } from "@/pages/DashboardPage";
import { ImportDetailPage } from "@/pages/ImportDetailPage";
import { LoginPage } from "@/pages/LoginPage";
import { NotFoundPage } from "@/pages/NotFoundPage";
import { ProfilePage } from "@/pages/ProfilePage";
import { ProjectDetailPage } from "@/pages/ProjectDetailPage";
import { ProjectsPage } from "@/pages/ProjectsPage";
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
            <Route path={ROUTES.HOME} element={<ProjectsPage />} />
            <Route path={ROUTES.PROJECT_DETAIL} element={<ProjectDetailPage />} />
            <Route path={ROUTES.IMPORT_DETAIL} element={<ImportDetailPage />} />
            <Route path={ROUTES.DASHBOARD} element={<DashboardPage />} />
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
