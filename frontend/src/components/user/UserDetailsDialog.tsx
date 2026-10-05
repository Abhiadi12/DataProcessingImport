import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import { PageLoader } from "@/components/common/PageLoader";
import { COMMON_MESSAGES, FIELD_LABELS, USERS_MESSAGES } from "@/constants";
import { useGetUser } from "@/service/user.service";
import type { UserDetailsDialogProps } from "@/types";
import { getApiErrorMessage } from "@/utils/api-error";
import { formatDate } from "@/utils/format";
import { DetailRow } from "./DetailRow";
import { RoleChip } from "./RoleChip";

// Open while userId is set. Fetches that one user (GET /users/:id) rather
// than reusing the table row, so it always shows the server's current state.
export function UserDetailsDialog({ userId, onClose }: UserDetailsDialogProps) {
  const { data, isPending, isError, error } = useGetUser(userId);
  const user = data?.data;

  return (
    <Dialog open={Boolean(userId)} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{USERS_MESSAGES.DETAILS_TITLE}</DialogTitle>
      <DialogContent>
        {isPending && <PageLoader />}
        {isError && <Alert severity="error">{getApiErrorMessage(error)}</Alert>}
        {user && (
          <div className="divide-y divide-slate-200">
            <DetailRow label={FIELD_LABELS.NAME}>{user.name}</DetailRow>
            <DetailRow label={FIELD_LABELS.EMAIL}>{user.email}</DetailRow>
            <DetailRow label={USERS_MESSAGES.COLUMN_ROLE}>
              <RoleChip role={user.role} />
            </DetailRow>
            <DetailRow label={USERS_MESSAGES.STATUS}>
              {user.isActive ? USERS_MESSAGES.ACTIVE : USERS_MESSAGES.INACTIVE}
            </DetailRow>
            <DetailRow label={USERS_MESSAGES.COLUMN_JOINED}>{formatDate(user.createdAt)}</DetailRow>
            <DetailRow label={USERS_MESSAGES.LAST_UPDATED}>{formatDate(user.updatedAt)}</DetailRow>
          </div>
        )}
      </DialogContent>
      <DialogActions className="px-6 pb-4">
        <Button onClick={onClose}>{COMMON_MESSAGES.CLOSE}</Button>
      </DialogActions>
    </Dialog>
  );
}
