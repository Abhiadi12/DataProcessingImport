import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import { COMMON_MESSAGES } from "@/constants";
import type { ConfirmDialogProps } from "@/types";

// For actions that are hard to undo. Closing the dialog any way other than
// the confirm button counts as cancel.
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = COMMON_MESSAGES.CANCEL,
  destructive = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onClose={onCancel} maxWidth="xs" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <DialogContentText>{description}</DialogContentText>
      </DialogContent>
      <DialogActions className="px-6 pb-4">
        <Button onClick={onCancel}>{cancelLabel}</Button>
        <Button variant="contained" color={destructive ? "error" : "primary"} onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
