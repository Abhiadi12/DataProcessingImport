import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { ERROR_BOUNDARY_MESSAGES } from "@/constants";
import type { ErrorFallbackProps } from "@/types";

export function ErrorFallback({ error, onReset }: ErrorFallbackProps) {
  return (
    <div role="alert" className="flex flex-col items-center gap-3 px-4 py-24 text-center">
      <Typography variant="h5" component="h1" className="font-semibold">
        {ERROR_BOUNDARY_MESSAGES.TITLE}
      </Typography>
      <Typography color="text.secondary">{ERROR_BOUNDARY_MESSAGES.DESCRIPTION}</Typography>

      {import.meta.env.DEV && (
        <pre className="max-w-2xl overflow-auto rounded-lg bg-slate-100 p-3 text-left text-sm text-red-700">
          {error.message}
        </pre>
      )}

      <div className="mt-2 flex gap-2">
        <Button variant="contained" onClick={onReset}>
          {ERROR_BOUNDARY_MESSAGES.TRY_AGAIN}
        </Button>
        <Button variant="outlined" onClick={() => window.location.reload()}>
          {ERROR_BOUNDARY_MESSAGES.RELOAD}
        </Button>
      </div>
    </div>
  );
}
