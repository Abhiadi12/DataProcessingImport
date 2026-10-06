import LinearProgress, { type LinearProgressProps } from "@mui/material/LinearProgress";
import Typography from "@mui/material/Typography";
import { IMPORT_DETAIL_MESSAGES } from "@/constants";
import type { ImportProgressBarProps, ImportStatus } from "@/types";
import { formatBytes } from "@/utils/file";

const BAR_COLOR: Record<ImportStatus, LinearProgressProps["color"]> = {
  UPLOADING: "inherit",
  QUEUED: "primary",
  PROCESSING: "primary",
  COMPLETED: "success",
  FAILED: "error",
  CANCELLED: "warning",
};

//INFO: Progress is how much of the FILE has been read, not how many rows are done:
// the row count isn't known until the end, but the file size always is.
export function ImportProgressBar({
  status,
  progressPercent,
  bytesRead,
  sizeBytes,
}: ImportProgressBarProps) {
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between gap-3">
        <Typography variant="h4" component="p" className="font-semibold">
          {progressPercent}%
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {IMPORT_DETAIL_MESSAGES.bytesOf(formatBytes(bytesRead), formatBytes(sizeBytes))}
        </Typography>
      </div>
      <LinearProgress
        variant="determinate"
        value={progressPercent}
        color={BAR_COLOR[status]}
        aria-label={IMPORT_DETAIL_MESSAGES.PROGRESS_TITLE}
        className="h-2 rounded"
      />
    </div>
  );
}
