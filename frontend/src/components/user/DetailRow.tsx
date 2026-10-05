import Typography from "@mui/material/Typography";
import type { DetailRowProps } from "@/types";

// One "label: value" line of a details list.
export function DetailRow({ label, children }: DetailRowProps) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2" component="div" className="text-right">
        {children}
      </Typography>
    </div>
  );
}
