import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import ReplayIcon from "@mui/icons-material/Replay";
import StopCircleOutlinedIcon from "@mui/icons-material/StopCircleOutlined";
import Button from "@mui/material/Button";
import { useState } from "react";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import {
  ACTIVE_IMPORT_STATUSES,
  IMPORT_ACTION_MESSAGES,
  IMPORT_FILE_KIND,
  IMPORT_STATUS,
  RETRYABLE_IMPORT_STATUSES,
  ROLE,
} from "@/constants";
import { useAppSelector } from "@/hooks/redux.hooks";
import { useNotify } from "@/hooks/useNotify";
import { useCancelImport, useDownloadImportFile, useRetryImport } from "@/service/import.service";
import { selectCurrentUser } from "@/store/slices/auth.slice";
import type { ImportActionsProps, ImportFileKind } from "@/types";
import { getApiErrorMessage } from "@/utils/api-error";
import { createIdempotencyKey } from "@/utils/file";
import { hasRole } from "@/utils/role";

export function ImportActions({ detail, status }: ImportActionsProps) {
  const user = useAppSelector(selectCurrentUser);
  const notify = useNotify();
  const cancelImport = useCancelImport();
  const retryImport = useRetryImport();
  const download = useDownloadImportFile();
  const [confirming, setConfirming] = useState<"cancel" | "retry" | null>(null);

  const isActive = ACTIVE_IMPORT_STATUSES.includes(status);
  // Accepted but not yet acted on: the worker stops after its current batch.
  const isCancelling = isActive && cancelImport.isSuccess;
  const canRetry =
    RETRYABLE_IMPORT_STATUSES.includes(status) &&
    (hasRole(user, ROLE.MANAGER) || detail.uploadedById === user?.id);
  // Before the upload has finished there may be no file in storage to fetch.
  const hasOriginal = status !== IMPORT_STATUS.UPLOADING;

  const showError = (error: unknown) => notify.error(getApiErrorMessage(error));

  const confirmCancel = () => {
    setConfirming(null);
    cancelImport.mutate(detail.id, {
      onSuccess: (res) => notify.success(res.message),
      onError: showError,
    });
  };

  const confirmRetry = () => {
    setConfirming(null);
    retryImport.mutate(
      { id: detail.id, idempotencyKey: createIdempotencyKey() },
      {
        onSuccess: (res) => {
          notify.success(res.message);
          // The import is running again, so an earlier cancel no longer counts.
          cancelImport.reset();
        },
        onError: showError,
      },
    );
  };

  const startDownload = (kind: ImportFileKind) => {
    download.mutate({ id: detail.id, kind }, { onError: showError });
  };
  const isDownloading = (kind: ImportFileKind) =>
    download.isPending && download.variables?.kind === kind;

  return (
    <div
      role="group"
      aria-label={IMPORT_ACTION_MESSAGES.ACTIONS_LABEL}
      className="flex flex-wrap gap-2"
    >
      {isActive && (
        <Button
          variant="outlined"
          color="error"
          startIcon={<StopCircleOutlinedIcon />}
          onClick={() => setConfirming("cancel")}
          disabled={isCancelling}
          loading={cancelImport.isPending}
        >
          {isCancelling ? IMPORT_ACTION_MESSAGES.CANCELLING : IMPORT_ACTION_MESSAGES.CANCEL}
        </Button>
      )}

      {canRetry && (
        <Button
          variant="contained"
          startIcon={<ReplayIcon />}
          onClick={() => setConfirming("retry")}
          loading={retryImport.isPending}
        >
          {IMPORT_ACTION_MESSAGES.RETRY}
        </Button>
      )}

      {hasOriginal && (
        <Button
          variant="outlined"
          startIcon={<DownloadOutlinedIcon />}
          onClick={() => startDownload(IMPORT_FILE_KIND.ORIGINAL)}
          loading={isDownloading(IMPORT_FILE_KIND.ORIGINAL)}
        >
          {IMPORT_ACTION_MESSAGES.DOWNLOAD_ORIGINAL}
        </Button>
      )}

      {detail.hasErrorReport && (
        <Button
          variant="outlined"
          startIcon={<DownloadOutlinedIcon />}
          onClick={() => startDownload(IMPORT_FILE_KIND.ERROR_REPORT)}
          loading={isDownloading(IMPORT_FILE_KIND.ERROR_REPORT)}
        >
          {IMPORT_ACTION_MESSAGES.DOWNLOAD_ERRORS}
        </Button>
      )}

      <ConfirmDialog
        open={confirming === "cancel"}
        title={IMPORT_ACTION_MESSAGES.CANCEL_TITLE}
        description={IMPORT_ACTION_MESSAGES.CANCEL_WARNING}
        confirmLabel={IMPORT_ACTION_MESSAGES.CANCEL_CONFIRM}
        cancelLabel={IMPORT_ACTION_MESSAGES.KEEP_RUNNING}
        destructive
        onConfirm={confirmCancel}
        onCancel={() => setConfirming(null)}
      />
      <ConfirmDialog
        open={confirming === "retry"}
        title={IMPORT_ACTION_MESSAGES.RETRY_TITLE}
        description={IMPORT_ACTION_MESSAGES.RETRY_WARNING}
        confirmLabel={IMPORT_ACTION_MESSAGES.RETRY_CONFIRM}
        onConfirm={confirmRetry}
        onCancel={() => setConfirming(null)}
      />
    </div>
  );
}
