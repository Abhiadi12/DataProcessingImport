import { zodResolver } from "@hookform/resolvers/zod";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import LinearProgress from "@mui/material/LinearProgress";
import MenuItem from "@mui/material/MenuItem";
import Typography from "@mui/material/Typography";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { FileInput } from "@/components/common/FileInput";
import { Input } from "@/components/common/Input";
import {
  COMMON_MESSAGES,
  IMPORT_FILE_ACCEPT,
  IMPORTS_MESSAGES,
  MAX_PAGE_SIZE,
  SCHEMAS_MESSAGES,
  UPLOAD_STEP,
} from "@/constants";
import { useNotify } from "@/hooks/useNotify";
import { isUploadCancelled, useUploadImport } from "@/service/import.service";
import { useGetProjectSchemas } from "@/service/schema.service";
import type { UploadAttempt, UploadFormValues, UploadImportDialogProps } from "@/types";
import { getApiErrorMessage } from "@/utils/api-error";
import { createIdempotencyKey } from "@/utils/file";
import { uploadImportSchema } from "@/validations/import.validation";

const DEFAULT_VALUES: UploadFormValues = { file: null, schemaId: "" };

export function UploadImportDialog({ open, projectId, onClose }: UploadImportDialogProps) {
  const notify = useNotify();
  const upload = useUploadImport();
  // One request for the whole list: a dropdown can't page.
  const schemas = useGetProjectSchemas(projectId, { page: 1, limit: MAX_PAGE_SIZE });
  const schemaOptions = schemas.data?.data?.items ?? [];
  const hasNoSchemas = schemas.isSuccess && schemaOptions.length === 0;

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UploadFormValues>({
    resolver: zodResolver(uploadImportSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const [attempt, setAttempt] = useState<UploadAttempt | null>(null);

  const onSubmit = handleSubmit(async ({ file, schemaId }) => {
    if (!file) {
      return;
    }
    const isRetry = attempt?.file === file && attempt.schemaId === schemaId;
    const idempotencyKey = isRetry ? attempt.key : createIdempotencyKey();
    setAttempt({ file, schemaId, key: idempotencyKey });

    try {
      const res = await upload.mutateAsync({ projectId, file, schemaId, idempotencyKey });
      setAttempt(null);
      notify.success(res.message);
      onClose();
    } catch (error) {
      if (isUploadCancelled(error)) {
        notify.success(IMPORTS_MESSAGES.UPLOAD_CANCELLED);
      }
    }
  });

  const isBusy = upload.isPending;
  const failure = upload.error && !isUploadCancelled(upload.error) ? upload.error : null;

  const stepLabel =
    upload.step === UPLOAD_STEP.UPLOADING
      ? IMPORTS_MESSAGES.uploadingPercent(upload.progress)
      : upload.step === UPLOAD_STEP.STARTING
        ? IMPORTS_MESSAGES.STEP_STARTING
        : IMPORTS_MESSAGES.STEP_PREPARING;

  return (
    <Dialog
      open={open}
      onClose={isBusy ? undefined : onClose}
      maxWidth="sm"
      fullWidth
      slotProps={{
        transition: {
          onExited: () => {
            reset(DEFAULT_VALUES);
            upload.reset();
            setAttempt(null);
          },
        },
      }}
    >
      <form onSubmit={onSubmit} noValidate>
        <DialogTitle>{IMPORTS_MESSAGES.UPLOAD_TITLE}</DialogTitle>
        <DialogContent className="flex flex-col gap-4 pt-2!">
          {failure && <Alert severity="error">{getApiErrorMessage(failure)}</Alert>}
          {hasNoSchemas && <Alert severity="warning">{IMPORTS_MESSAGES.NO_SCHEMAS}</Alert>}

          <Controller
            control={control}
            name="file"
            render={({ field }) => (
              <FileInput
                label={IMPORTS_MESSAGES.FILE_LABEL}
                accept={IMPORT_FILE_ACCEPT}
                file={field.value}
                onChange={field.onChange}
                disabled={isBusy}
                error={Boolean(errors.file)}
                helperText={errors.file?.message ?? IMPORTS_MESSAGES.FILE_HINT}
              />
            )}
          />

          <Controller
            control={control}
            name="schemaId"
            render={({ field }) => (
              <Input
                select
                label={IMPORTS_MESSAGES.SCHEMA_LABEL}
                disabled={isBusy || schemaOptions.length === 0}
                error={Boolean(errors.schemaId)}
                helperText={errors.schemaId?.message ?? IMPORTS_MESSAGES.SCHEMA_HINT}
                {...field}
              >
                {schemaOptions.map((schema) => (
                  <MenuItem key={schema.id} value={schema.id}>
                    {schema.name}
                    {schema.isGlobal && (
                      <Typography component="span" variant="caption" color="text.secondary">
                        &nbsp;· {SCHEMAS_MESSAGES.GLOBAL}
                      </Typography>
                    )}
                  </MenuItem>
                ))}
              </Input>
            )}
          />

          {isBusy && (
            <div aria-live="polite">
              <Typography variant="body2" color="text.secondary" className="mb-1">
                {stepLabel}
              </Typography>
              <LinearProgress
                variant={upload.step === UPLOAD_STEP.UPLOADING ? "determinate" : "indeterminate"}
                value={upload.progress}
              />
            </div>
          )}
        </DialogContent>
        <DialogActions className="px-6 pb-4">
          {isBusy ? (
            <Button onClick={upload.cancel}>{IMPORTS_MESSAGES.CANCEL_UPLOAD}</Button>
          ) : (
            <Button onClick={onClose}>{COMMON_MESSAGES.CANCEL}</Button>
          )}
          <Button type="submit" variant="contained" loading={isBusy} disabled={hasNoSchemas}>
            {IMPORTS_MESSAGES.UPLOAD_SUBMIT}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
