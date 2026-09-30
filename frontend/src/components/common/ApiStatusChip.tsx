import Chip from "@mui/material/Chip";
import Tooltip from "@mui/material/Tooltip";
import { HEALTH_MESSAGES } from "@/constants";
import { useGetHealth } from "@/service/health.service";
import { getApiErrorMessage } from "@/utils/api-error";

export function ApiStatusChip() {
  const { isPending, isError, error } = useGetHealth();

  if (isPending) {
    return <Chip size="small" variant="outlined" label={HEALTH_MESSAGES.CHECKING} />;
  }

  if (isError) {
    return (
      <Tooltip title={getApiErrorMessage(error)}>
        <Chip size="small" variant="outlined" color="error" label={HEALTH_MESSAGES.OFFLINE} />
      </Tooltip>
    );
  }

  return <Chip size="small" variant="outlined" color="success" label={HEALTH_MESSAGES.ONLINE} />;
}
