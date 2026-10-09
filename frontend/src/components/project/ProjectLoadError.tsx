import Button from "@mui/material/Button";
import { Link as RouterLink } from "react-router";
import { EmptyState } from "@/components/common/EmptyState";
import { HTTP_STATUS, PROJECTS_MESSAGES, ROUTES } from "@/constants";
import type { ProjectLoadErrorProps } from "@/types";
import { getApiErrorMessage, getApiErrorStatus } from "@/utils/api-error";

// Why the project detail request failed, in the user's terms.
//
// For a non-admin the API answers 403 both for "exists but you're not a
// member" and for "doesn't exist" (it checks membership first), so the 403
// text can't promise the project exists. Only admins ever see the 404.
export function ProjectLoadError({ error }: ProjectLoadErrorProps) {
  const status = getApiErrorStatus(error);
  const backButton = (
    <Button variant="contained" component={RouterLink} to={ROUTES.HOME}>
      {PROJECTS_MESSAGES.BACK_TO_LIST}
    </Button>
  );

  if (status === HTTP_STATUS.FORBIDDEN) {
    return (
      <EmptyState
        title={PROJECTS_MESSAGES.FORBIDDEN_TITLE}
        description={PROJECTS_MESSAGES.FORBIDDEN_DESCRIPTION}
        action={backButton}
      />
    );
  }

  if (status === HTTP_STATUS.NOT_FOUND) {
    return (
      <EmptyState
        title={PROJECTS_MESSAGES.NOT_FOUND_TITLE}
        description={PROJECTS_MESSAGES.NOT_FOUND_DESCRIPTION}
        action={backButton}
      />
    );
  }

  return (
    <EmptyState
      title={PROJECTS_MESSAGES.ERROR_TITLE}
      description={getApiErrorMessage(error)}
      action={backButton}
    />
  );
}
