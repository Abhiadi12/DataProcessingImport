import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormHelperText from "@mui/material/FormHelperText";
import IconButton from "@mui/material/IconButton";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import { Controller, useFormContext, useWatch } from "react-hook-form";
import {
  FIELD_TYPE_LABELS,
  FIELD_TYPES,
  NON_UNIQUE_FIELD_TYPE,
  SCHEMAS_MESSAGES,
} from "@/constants";
import type { SchemaFieldRowProps, SchemaFormValues } from "@/types";

export function SchemaFieldRow({ index, canRemove, onRemove }: SchemaFieldRowProps) {
  const {
    register,
    control,
    setValue,
    formState: { errors },
  } = useFormContext<SchemaFormValues>();
  const type = useWatch({ control, name: `fields.${index}.type` });
  const unique = useWatch({ control, name: `fields.${index}.unique` });
  const rowErrors = errors.fields?.[index];
  const position = index + 1;

  return (
    <div className="rounded-lg border border-slate-200 p-3">
      <div className="flex flex-wrap items-start gap-3">
        <TextField
          size="small"
          label={SCHEMAS_MESSAGES.FIELD_NAME}
          error={Boolean(rowErrors?.name)}
          helperText={rowErrors?.name?.message}
          className="min-w-40 flex-1"
          slotProps={{ htmlInput: { "aria-label": SCHEMAS_MESSAGES.fieldNumber(position) } }}
          {...register(`fields.${index}.name`)}
        />

        <Controller
          control={control}
          name={`fields.${index}.type`}
          render={({ field }) => (
            <TextField
              select
              size="small"
              label={SCHEMAS_MESSAGES.FIELD_TYPE}
              className="w-40"
              {...field}
              onChange={(event) => {
                field.onChange(event);
                if (event.target.value === NON_UNIQUE_FIELD_TYPE) {
                  setValue(`fields.${index}.unique`, false, { shouldValidate: true });
                }
              }}
            >
              {FIELD_TYPES.map((fieldType) => (
                <MenuItem key={fieldType} value={fieldType}>
                  {FIELD_TYPE_LABELS[fieldType]}
                </MenuItem>
              ))}
            </TextField>
          )}
        />

        <Controller
          control={control}
          name={`fields.${index}.required`}
          render={({ field }) => (
            <FormControlLabel
              label={SCHEMAS_MESSAGES.FIELD_REQUIRED}
              control={
                <Checkbox
                  checked={field.value}
                  // A unique field is always required.
                  disabled={unique}
                  onChange={(event) => field.onChange(event.target.checked)}
                />
              }
            />
          )}
        />

        <Controller
          control={control}
          name={`fields.${index}.unique`}
          render={({ field }) => (
            <FormControlLabel
              label={SCHEMAS_MESSAGES.FIELD_UNIQUE}
              control={
                <Checkbox
                  checked={field.value}
                  disabled={type === NON_UNIQUE_FIELD_TYPE}
                  onChange={(event) => {
                    field.onChange(event.target.checked);
                    if (event.target.checked) {
                      setValue(`fields.${index}.required`, true);
                    }
                  }}
                />
              }
            />
          )}
        />

        <IconButton
          onClick={onRemove}
          disabled={!canRemove}
          aria-label={SCHEMAS_MESSAGES.removeField(position)}
          className="ml-auto"
        >
          <DeleteOutlinedIcon />
        </IconButton>
      </div>

      {rowErrors?.unique && <FormHelperText error>{rowErrors.unique.message}</FormHelperText>}
    </div>
  );
}
