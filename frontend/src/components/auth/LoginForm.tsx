import { zodResolver } from "@hookform/resolvers/zod";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import { useForm } from "react-hook-form";
import { PasswordField } from "@/components/common/PasswordField";
import { AUTH_MESSAGES, FIELD_LABELS } from "@/constants";
import { useLogin } from "@/service/auth.service";
import type { LoginInput } from "@/types";
import { applyServerErrors } from "@/utils/form-errors";
import { loginSchema } from "@/validations/auth.validation";

export function LoginForm() {
  const login = useLogin();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = handleSubmit((values) => {
    login.mutate(values, {
      onError: (error) => applyServerErrors(error, setError, ["email", "password"]),
    });
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      {errors.root && <Alert severity="error">{errors.root.message}</Alert>}

      <TextField
        label={FIELD_LABELS.EMAIL}
        type="email"
        autoComplete="email"
        autoFocus
        error={Boolean(errors.email)}
        helperText={errors.email?.message}
        {...register("email")}
      />
      <PasswordField
        label={FIELD_LABELS.PASSWORD}
        autoComplete="current-password"
        error={Boolean(errors.password)}
        helperText={errors.password?.message}
        {...register("password")}
      />

      <Button type="submit" variant="contained" size="large" loading={login.isPending}>
        {AUTH_MESSAGES.LOGIN_SUBMIT}
      </Button>
    </form>
  );
}
