import Link from "@mui/material/Link";
import { Link as RouterLink } from "react-router";
import { AuthCard } from "@/components/auth/AuthCard";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { AUTH_MESSAGES, ROUTES } from "@/constants";

export function RegisterPage() {
  return (
    <AuthCard
      title={AUTH_MESSAGES.REGISTER_TITLE}
      subtitle={AUTH_MESSAGES.REGISTER_SUBTITLE}
      footer={
        <>
          {AUTH_MESSAGES.HAVE_ACCOUNT}{" "}
          <Link component={RouterLink} to={ROUTES.LOGIN}>
            {AUTH_MESSAGES.GO_TO_LOGIN}
          </Link>
        </>
      }
    >
      <RegisterForm />
    </AuthCard>
  );
}
