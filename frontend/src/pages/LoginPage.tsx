import Link from "@mui/material/Link";
import { Link as RouterLink } from "react-router";
import { AuthCard } from "@/components/auth/AuthCard";
import { LoginForm } from "@/components/auth/LoginForm";
import { AUTH_MESSAGES, ROUTES } from "@/constants";

export function LoginPage() {
  return (
    <AuthCard
      title={AUTH_MESSAGES.LOGIN_TITLE}
      subtitle={AUTH_MESSAGES.LOGIN_SUBTITLE}
      footer={
        <>
          {AUTH_MESSAGES.NO_ACCOUNT}{" "}
          <Link component={RouterLink} to={ROUTES.REGISTER}>
            {AUTH_MESSAGES.GO_TO_REGISTER}
          </Link>
        </>
      }
    >
      <LoginForm />
    </AuthCard>
  );
}
