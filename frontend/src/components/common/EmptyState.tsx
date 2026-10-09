import Typography from "@mui/material/Typography";
import type { EmptyStateProps } from "@/types";

// Centered message for "nothing here" and "can't show this" situations.
export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-2 px-4 py-16 text-center">
      <Typography variant="h6" component="h2">
        {title}
      </Typography>
      <Typography color="text.secondary" className="max-w-md">
        {description}
      </Typography>
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}
