import { zodResolver } from "@hookform/resolvers/zod";
import AddIcon from "@mui/icons-material/Add";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormHelperText from "@mui/material/FormHelperText";
import Switch from "@mui/material/Switch";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { Controller, FormProvider, useFieldArray, useForm } from "react-hook-form";
import { COMMON_MESSAGES, ROLE, SCHEMA_MAX_FIELDS, SCHEMAS_MESSAGES } from "@/constants";
import { useAppSelector } from "@/hooks/redux.hooks";
import { useNotify } from "@/hooks/useNotify";
import { useCreateSchema } from "@/service/schema.service";
import { selectCurrentUser } from "@/store/slices/auth.slice";
import type { SchemaFieldFormValue, SchemaFormDialogProps, SchemaFormValues } from "@/types";
import { applyServerErrors } from "@/utils/form-errors";
import { hasRole } from "@/utils/role";
import { toCreateSchemaInput } from "@/utils/schema";
import { schemaFormSchema } from "@/validations/schema.validation";
import { SchemaFieldRow } from "./SchemaFieldRow";

const EMPTY_FIELD: SchemaFieldFormValue = {
  name: "",
  type: "string",
  required: false,
  unique: false,
};

const DEFAULT_VALUES: SchemaFormValues = {
  name: "",
  description: "",
  isGlobal: false,
  fields: [{ ...EMPTY_FIELD, required: true, unique: true }],
};

// Create only — the backend has no endpoint to edit a schema.
export function SchemaFormDialog({ open, projectId, onClose }: SchemaFormDialogProps) {
  const isAdmin = hasRole(useAppSelector(selectCurrentUser), ROLE.ADMIN);
  const createSchema = useCreateSchema();
  const notify = useNotify();

  const form = useForm<SchemaFormValues>({
    resolver: zodResolver(schemaFormSchema),
    defaultValues: DEFAULT_VALUES,
  });
  const {
    register,
    control,
    handleSubmit,
    setError,
    setFocus,
    reset,
    formState: { errors },
  } = form;
  const { fields, append, remove } = useFieldArray({ control, name: "fields" });

  const onSubmit = handleSubmit((values) => {
    createSchema.mutate(
      {
        projectId,
        // Never trust the switch alone: a non-admin has no switch, but the
        // value would still be false-by-default only by convention.
        isGlobal: isAdmin && values.isGlobal,
        input: toCreateSchemaInput(values),
      },
      {
        onSuccess: (res) => {
          notify.success(res.message);
          onClose();
        },
        onError: (error) => applyServerErrors(error, setError, ["name", "description", "fields"]),
      },
    );
  });

  const fieldsError = errors.fields?.root?.message ?? errors.fields?.message;

  return (
    <Dialog
      open={open}
      onClose={createSchema.isPending ? undefined : onClose}
      maxWidth="md"
      fullWidth
      slotProps={{
        transition: {
          onEntered: () => setFocus("name"),
          onExited: () => reset(DEFAULT_VALUES),
        },
      }}
    >
      <FormProvider {...form}>
        <form onSubmit={onSubmit} noValidate>
          <DialogTitle>{SCHEMAS_MESSAGES.CREATE_TITLE}</DialogTitle>
          <DialogContent className="flex flex-col gap-4 pt-2!">
            <Alert severity="info">{SCHEMAS_MESSAGES.IMMUTABLE_NOTICE}</Alert>
            {errors.root && <Alert severity="error">{errors.root.message}</Alert>}

            <TextField
              label={SCHEMAS_MESSAGES.NAME_LABEL}
              error={Boolean(errors.name)}
              helperText={errors.name?.message}
              {...register("name")}
            />
            <TextField
              label={SCHEMAS_MESSAGES.DESCRIPTION_LABEL}
              multiline
              minRows={2}
              error={Boolean(errors.description)}
              helperText={errors.description?.message}
              {...register("description")}
            />

            {isAdmin && (
              <div>
                <Controller
                  control={control}
                  name="isGlobal"
                  render={({ field }) => (
                    <FormControlLabel
                      label={SCHEMAS_MESSAGES.GLOBAL_LABEL}
                      control={
                        <Switch
                          checked={field.value}
                          onChange={(event) => field.onChange(event.target.checked)}
                        />
                      }
                    />
                  )}
                />
                <FormHelperText>{SCHEMAS_MESSAGES.GLOBAL_HINT}</FormHelperText>
              </div>
            )}

            <div className="flex flex-col gap-3">
              <Typography variant="subtitle2">{SCHEMAS_MESSAGES.FIELDS_TITLE}</Typography>
              {fieldsError && <Alert severity="error">{fieldsError}</Alert>}

              {fields.map((field, index) => (
                <SchemaFieldRow
                  key={field.id}
                  index={index}
                  canRemove={fields.length > 1}
                  onRemove={() => remove(index)}
                />
              ))}

              <Button
                startIcon={<AddIcon />}
                onClick={() => append(EMPTY_FIELD)}
                disabled={fields.length >= SCHEMA_MAX_FIELDS}
                className="self-start"
              >
                {SCHEMAS_MESSAGES.ADD_FIELD}
              </Button>
            </div>
          </DialogContent>
          <DialogActions className="px-6 pb-4">
            <Button onClick={onClose} disabled={createSchema.isPending}>
              {COMMON_MESSAGES.CANCEL}
            </Button>
            <Button type="submit" variant="contained" loading={createSchema.isPending}>
              {SCHEMAS_MESSAGES.CREATE_SUBMIT}
            </Button>
          </DialogActions>
        </form>
      </FormProvider>
    </Dialog>
  );
}
