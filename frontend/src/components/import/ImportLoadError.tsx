import Button from "@mui/material/Button";
import { Link as RouterLink } from "react-router";
import { EmptyState } from "@/components/common/EmptyState";
import { HTTP_STATUS, IMPORT_DETAIL_MESSAGES, ROUTES } from "@/constants";
import type { ImportLoadErrorProps } from "@/types";
import { getApiErrorMessage, getApiErrorStatus } from "@/utils/api-error";

export function ImportLoadError({ error }: ImportLoadErrorProps) {
  const status = getApiErrorStatus(error);
  const backButton = (
    <Button variant="contained" component={RouterLink} to={ROUTES.HOME}>
      {IMPORT_DETAIL_MESSAGES.BACK_TO_PROJECTS}
    </Button>
  );

  if (status === HTTP_STATUS.NOT_FOUND) {
    return (
      <EmptyState
        title={IMPORT_DETAIL_MESSAGES.NOT_FOUND_TITLE}
        description={IMPORT_DETAIL_MESSAGES.NOT_FOUND_DESCRIPTION}
        action={backButton}
      />
    );
  }

  if (status === HTTP_STATUS.FORBIDDEN) {
    return (
      <EmptyState
        title={IMPORT_DETAIL_MESSAGES.FORBIDDEN_TITLE}
        description={IMPORT_DETAIL_MESSAGES.FORBIDDEN_DESCRIPTION}
        action={backButton}
      />
    );
  }

  return (
    <EmptyState
      title={IMPORT_DETAIL_MESSAGES.ERROR_TITLE}
      description={getApiErrorMessage(error)}
      action={backButton}
    />
  );
}
