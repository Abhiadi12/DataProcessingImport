import { zodResolver } from "@hookform/resolvers/zod";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import { useForm } from "react-hook-form";
import { MEMBERS_MESSAGES } from "@/constants";
import { useNotify } from "@/hooks/useNotify";
import { useAddProjectMember } from "@/service/project.service";
import type { AddMemberFormProps, AddMemberFormValues } from "@/types";
import { applyServerErrors } from "@/utils/form-errors";
import { addMemberSchema } from "@/validations/project.validation";

export function AddMemberForm({ projectId }: AddMemberFormProps) {
  const addMember = useAddProjectMember();
  const notify = useNotify();
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors },
  } = useForm<AddMemberFormValues>({
    resolver: zodResolver(addMemberSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = handleSubmit(({ email }) => {
    addMember.mutate(
      { projectId, email },
      {
        onSuccess: (res) => {
          notify.success(res.message);
          reset();
        },
        onError: (error) => applyServerErrors(error, setError, ["email"]),
      },
    );
  });

  // The API's own failures here ("User not found" for an unregistered email,
  // "already a member") arrive as a general message, not a field error. With
  // one field on the form they can only be about the email, so both kinds are
  // shown under it.
  const message = errors.email?.message ?? errors.root?.message;

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-wrap items-start gap-3">
      <TextField
        size="small"
        type="email"
        label={MEMBERS_MESSAGES.ADD_LABEL}
        autoComplete="off"
        error={Boolean(message)}
        helperText={message}
        className="min-w-64 flex-1 sm:max-w-sm"
        {...register("email")}
      />
      <Button type="submit" variant="contained" loading={addMember.isPending}>
        {MEMBERS_MESSAGES.ADD_SUBMIT}
      </Button>
    </form>
  );
}
