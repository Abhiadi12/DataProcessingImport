import Chip from "@mui/material/Chip";
import { ROLE, ROLE_LABELS } from "@/constants";
import type { PublicUser } from "@/types";

export function RoleChip({ role }: Pick<PublicUser, "role">) {
  return (
    <Chip
      size="small"
      variant="outlined"
      color={role === ROLE.ADMIN ? "primary" : "default"}
      label={ROLE_LABELS[role]}
    />
  );
}
