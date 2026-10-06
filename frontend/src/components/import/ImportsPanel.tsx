import UploadFileOutlinedIcon from "@mui/icons-material/UploadFileOutlined";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { useState } from "react";
import { EmptyState } from "@/components/common/EmptyState";
import { IMPORTS_MESSAGES } from "@/constants";
import type { ImportsPanelProps } from "@/types";
import { UploadImportDialog } from "./UploadImportDialog";

export function ImportsPanel({ projectId }: ImportsPanelProps) {
  const [uploadOpen, setUploadOpen] = useState(false);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-4">
        <Typography variant="body2" color="text.secondary">
          {IMPORTS_MESSAGES.INTRO}
        </Typography>
        <Button
          variant="contained"
          startIcon={<UploadFileOutlinedIcon />}
          onClick={() => setUploadOpen(true)}
        >
          {IMPORTS_MESSAGES.UPLOAD}
        </Button>
      </div>

      <EmptyState
        title={IMPORTS_MESSAGES.HISTORY_PLACEHOLDER_TITLE}
        description={IMPORTS_MESSAGES.HISTORY_PLACEHOLDER}
      />

      <UploadImportDialog
        open={uploadOpen}
        projectId={projectId}
        onClose={() => setUploadOpen(false)}
      />
    </div>
  );
}
