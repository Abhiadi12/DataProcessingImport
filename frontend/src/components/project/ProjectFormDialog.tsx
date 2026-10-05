import { zodResolver } from "@hookform/resolvers/zod";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import TextField from "@mui/material/TextField";
import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { COMMON_MESSAGES, PROJECTS_MESSAGES } from "@/constants";
import { useNotify } from "@/hooks/useNotify";
import { useCreateProject, useUpdateProject } from "@/service/project.service";
import type { ApiResponse, Project, ProjectFormDialogProps, ProjectFormValues } from "@/types";
import { applyServerErrors } from "@/utils/form-errors";
import { projectSchema } from "@/validations/project.validation";

// One dialog for both create (project = null) and edit.
export function ProjectFormDialog({ open, project, onClose }: ProjectFormDialogProps) {
  const createProject = useCreateProject();
  const updateProject = useUpdateProject();
  const notify = useNotify();
  const isEdit = project !== null;
  const isSaving = createProject.isPending || updateProject.isPending;

  // `values` keeps the form in sync with whichever project is being edited.
  const values = useMemo<ProjectFormValues>(
    () => ({ name: project?.name ?? "", description: project?.description ?? "" }),
    [project],
  );
  const {
    register,
    handleSubmit,
    setError,
    setFocus,
    reset,
    formState: { errors, isDirty },
  } = useForm<ProjectFormValues>({ resolver: zodResolver(projectSchema), values });

  const callbacks = {
    onSuccess: (res: ApiResponse<Project>) => {
      notify.success(res.message);
      onClose();
    },
    onError: (error: unknown) => applyServerErrors(error, setError, ["name", "description"]),
  };

  const onSubmit = handleSubmit((form) => {
    if (project) {
      // Sent even when blank: an empty description is how one gets cleared.
      updateProject.mutate({ id: project.id, input: form }, callbacks);
    } else {
      const { name, description } = form;
      createProject.mutate(description ? { name, description } : { name }, callbacks);
    }
  });

  return (
    <Dialog
      open={open}
      onClose={isSaving ? undefined : onClose}
      maxWidth="sm"
      fullWidth
      slotProps={{
        transition: {
          // Focus the name field once the dialog is open. Done here rather
          // than with autoFocus, which MUI's Dialog loses under React 18
          // StrictMode in development.
          onEntered: () => setFocus("name"),
          // Clear typed text and errors once fully closed, so the next "New
          // project" starts blank without the fields visibly emptying during
          // the close animation.
          onExited: () => reset(values),
        },
      }}
    >
      <form onSubmit={onSubmit} noValidate>
        <DialogTitle>
          {isEdit ? PROJECTS_MESSAGES.EDIT_TITLE : PROJECTS_MESSAGES.CREATE_TITLE}
        </DialogTitle>
        <DialogContent className="flex flex-col gap-4 pt-2!">
          {errors.root && <Alert severity="error">{errors.root.message}</Alert>}

          <TextField
            label={PROJECTS_MESSAGES.FIELD_NAME}
            error={Boolean(errors.name)}
            helperText={errors.name?.message}
            {...register("name")}
          />
          <TextField
            label={PROJECTS_MESSAGES.FIELD_DESCRIPTION}
            multiline
            minRows={3}
            error={Boolean(errors.description)}
            helperText={errors.description?.message}
            {...register("description")}
          />
        </DialogContent>
        <DialogActions className="px-6 pb-4">
          <Button onClick={onClose} disabled={isSaving}>
            {COMMON_MESSAGES.CANCEL}
          </Button>
          <Button
            type="submit"
            variant="contained"
            // Editing with nothing changed has nothing to save.
            disabled={isEdit && !isDirty}
            loading={isSaving}
          >
            {isEdit ? COMMON_MESSAGES.SAVE_CHANGES : PROJECTS_MESSAGES.CREATE_SUBMIT}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
