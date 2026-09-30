import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { Link as RouterLink } from "react-router";
import { COMMON_MESSAGES, NOT_FOUND_MESSAGES, ROUTES } from "@/constants";

export function NotFoundPage() {
  return (
    <div className="flex flex-col items-center gap-3 py-24 text-center">
      <Typography variant="overline" color="primary">
        {NOT_FOUND_MESSAGES.CODE}
      </Typography>
      <Typography variant="h4" component="h1" className="font-semibold">
        {NOT_FOUND_MESSAGES.TITLE}
      </Typography>
      <Typography color="text.secondary">{NOT_FOUND_MESSAGES.DESCRIPTION}</Typography>
      <Button variant="contained" component={RouterLink} to={ROUTES.HOME} className="mt-4">
        {COMMON_MESSAGES.BACK_HOME}
      </Button>
    </div>
  );
}
