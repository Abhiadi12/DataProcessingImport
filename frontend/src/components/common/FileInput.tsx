import UploadFileOutlinedIcon from "@mui/icons-material/UploadFileOutlined";
import Button from "@mui/material/Button";
import FormHelperText from "@mui/material/FormHelperText";
import Typography from "@mui/material/Typography";
import { FILE_INPUT_MESSAGES } from "@/constants";
import type { FileInputProps } from "@/types";
import { formatBytes } from "@/utils/file";

export function FileInput({
  label,
  accept,
  file,
  onChange,
  error = false,
  helperText,
  disabled = false,
}: FileInputProps) {
  return (
    <div>
      <Typography variant="body2" color={error ? "error" : "text.secondary"} className="mb-1">
        {label}
      </Typography>

      <div
        className={`flex flex-wrap items-center gap-3 rounded-lg border p-3 ${
          error ? "border-red-600" : "border-slate-300"
        }`}
      >
        <Button
          component="label"
          variant="outlined"
          startIcon={<UploadFileOutlinedIcon />}
          disabled={disabled}
        >
          {file ? FILE_INPUT_MESSAGES.CHANGE : FILE_INPUT_MESSAGES.CHOOSE}
          <input
            type="file"
            hidden
            accept={accept}
            disabled={disabled}
            aria-label={label}
            onChange={(event) => {
              onChange(event.target.files?.[0] ?? null);
              event.target.value = "";
            }}
          />
        </Button>

        {file ? (
          <div className="min-w-0 flex-1">
            <Typography variant="body2" className="truncate font-medium">
              {file.name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {formatBytes(file.size)}
            </Typography>
          </div>
        ) : (
          <Typography variant="body2" color="text.secondary">
            {FILE_INPUT_MESSAGES.NONE_SELECTED}
          </Typography>
        )}
      </div>

      {helperText && <FormHelperText error={error}>{helperText}</FormHelperText>}
    </div>
  );
}
