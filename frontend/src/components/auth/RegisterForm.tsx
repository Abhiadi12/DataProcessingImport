import { zodResolver } from "@hookform/resolvers/zod";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router";
import { PasswordField } from "@/components/common/PasswordField";
import { AUTH_MESSAGES, FIELD_LABELS, ROUTES } from "@/constants";
import { useNotify } from "@/hooks/useNotify";
import { useRegister } from "@/service/auth.service";
import type { RegisterFormValues } from "@/types";
import { applyServerErrors } from "@/utils/form-errors";
import { registerSchema } from "@/validations/auth.validation";

export function RegisterForm() {
  const registerUser = useRegister();
  const navigate = useNavigate();
  const notify = useNotify();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "", confirmPassword: "" },
  });

  const onSubmit = handleSubmit(({ confirmPassword: _confirmPassword, ...input }) => {
    registerUser.mutate(input, {
      onSuccess: () => {
        notify.success(AUTH_MESSAGES.REGISTERED);
        navigate(ROUTES.LOGIN);
      },
      onError: (error) => applyServerErrors(error, setError, ["name", "email", "password"]),
    });
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      {errors.root && <Alert severity="error">{errors.root.message}</Alert>}

      <TextField
        label={FIELD_LABELS.NAME}
        autoComplete="name"
        autoFocus
        error={Boolean(errors.name)}
        helperText={errors.name?.message}
        {...register("name")}
      />
      <TextField
        label={FIELD_LABELS.EMAIL}
        type="email"
        autoComplete="email"
        error={Boolean(errors.email)}
        helperText={errors.email?.message}
        {...register("email")}
      />
      <PasswordField
        label={FIELD_LABELS.PASSWORD}
        autoComplete="new-password"
        error={Boolean(errors.password)}
        helperText={errors.password?.message}
        {...register("password")}
      />
      <PasswordField
        label={FIELD_LABELS.CONFIRM_PASSWORD}
        autoComplete="new-password"
        error={Boolean(errors.confirmPassword)}
        helperText={errors.confirmPassword?.message}
        {...register("confirmPassword")}
      />

      <Button type="submit" variant="contained" size="large" loading={registerUser.isPending}>
        {AUTH_MESSAGES.REGISTER_SUBMIT}
      </Button>
    </form>
  );
}
