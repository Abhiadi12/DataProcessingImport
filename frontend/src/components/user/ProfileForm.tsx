import { zodResolver } from "@hookform/resolvers/zod";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import { useForm } from "react-hook-form";
import { COMMON_MESSAGES, FIELD_LABELS } from "@/constants";
import { useNotify } from "@/hooks/useNotify";
import { useUpdateProfile } from "@/service/user.service";
import type { ProfileFormProps, UpdateProfileInput } from "@/types";
import { applyServerErrors } from "@/utils/form-errors";
import { updateProfileSchema } from "@/validations/user.validation";

export function ProfileForm({ user }: ProfileFormProps) {
  const updateProfile = useUpdateProfile();
  const notify = useNotify();
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isDirty },
  } = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: { name: user.name, email: user.email },
  });

  const onSubmit = handleSubmit((values) => {
    updateProfile.mutate(values, {
      onSuccess: (res) => {
        notify.success(res.message);
        // Make the saved values the new baseline, so Save disables again.
        if (res.data) {
          reset({ name: res.data.name, email: res.data.email });
        }
      },
      onError: (error) => applyServerErrors(error, setError, ["name", "email"]),
    });
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      {errors.root && <Alert severity="error">{errors.root.message}</Alert>}

      <TextField
        label={FIELD_LABELS.NAME}
        autoComplete="name"
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

      <Button
        type="submit"
        variant="contained"
        className="self-start"
        disabled={!isDirty}
        loading={updateProfile.isPending}
      >
        {COMMON_MESSAGES.SAVE_CHANGES}
      </Button>
    </form>
  );
}
