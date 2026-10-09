import Chip, { type ChipProps } from "@mui/material/Chip";
import { IMPORT_STATUS_LABELS } from "@/constants";
import type { ImportStatus, ImportStatusChipProps } from "@/types";

const STATUS_COLOR: Record<ImportStatus, ChipProps["color"]> = {
  UPLOADING: "default",
  QUEUED: "info",
  PROCESSING: "primary",
  COMPLETED: "success",
  FAILED: "error",
  CANCELLED: "warning",
};

export function ImportStatusChip({ status }: ImportStatusChipProps) {
  return (
    <Chip
      size="small"
      variant="outlined"
      color={STATUS_COLOR[status]}
      label={IMPORT_STATUS_LABELS[status]}
    />
  );
}
