import { zodResolver } from "@hookform/resolvers/zod";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import { useForm } from "react-hook-form";
import { PasswordField } from "@/components/common/PasswordField";
import { FIELD_LABELS, PROFILE_MESSAGES } from "@/constants";
import { useNotify } from "@/hooks/useNotify";
import { useChangePassword } from "@/service/user.service";
import type { ChangePasswordFormValues } from "@/types";
import { applyServerErrors } from "@/utils/form-errors";
import { changePasswordSchema } from "@/validations/user.validation";

export function ChangePasswordForm() {
  const changePassword = useChangePassword();
  const notify = useNotify();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmNewPassword: "" },
  });

  const onSubmit = handleSubmit(async ({ confirmNewPassword: _confirmNewPassword, ...input }) => {
    try {
      const res = await changePassword.mutateAsync(input);
      notify.success(res.message);
    } catch (error) {
      applyServerErrors(error, setError, ["currentPassword", "newPassword"]);
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      {errors.root && <Alert severity="error">{errors.root.message}</Alert>}

      <PasswordField
        label={FIELD_LABELS.CURRENT_PASSWORD}
        autoComplete="current-password"
        error={Boolean(errors.currentPassword)}
        helperText={errors.currentPassword?.message}
        {...register("currentPassword")}
      />
      <PasswordField
        label={FIELD_LABELS.NEW_PASSWORD}
        autoComplete="new-password"
        error={Boolean(errors.newPassword)}
        helperText={errors.newPassword?.message}
        {...register("newPassword")}
      />
      <PasswordField
        label={FIELD_LABELS.CONFIRM_NEW_PASSWORD}
        autoComplete="new-password"
        error={Boolean(errors.confirmNewPassword)}
        helperText={errors.confirmNewPassword?.message}
        {...register("confirmNewPassword")}
      />

      <Button
        type="submit"
        variant="contained"
        className="self-start"
        loading={changePassword.isPending}
      >
        {PROFILE_MESSAGES.PASSWORD_SUBMIT}
      </Button>
    </form>
  );
}
