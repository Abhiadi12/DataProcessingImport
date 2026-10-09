import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Typography from "@mui/material/Typography";
import { PageLoader } from "@/components/common/PageLoader";
import { DetailRow } from "@/components/user/DetailRow";
import { COMMON_MESSAGES, SCHEMAS_MESSAGES } from "@/constants";
import { useGetSchema } from "@/service/schema.service";
import type { SchemaDetailsDialogProps } from "@/types";
import { getApiErrorMessage } from "@/utils/api-error";
import { formatDate } from "@/utils/format";
import { SchemaFieldsTable } from "./SchemaFieldsTable";

export function SchemaDetailsDialog({ schemaId, onClose }: SchemaDetailsDialogProps) {
  const { data, isPending, isError, error } = useGetSchema(schemaId);
  const schema = data?.data;

  return (
    <Dialog open={Boolean(schemaId)} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{SCHEMAS_MESSAGES.DETAILS_TITLE}</DialogTitle>
      <DialogContent>
        {isPending && <PageLoader />}
        {isError && <Alert severity="error">{getApiErrorMessage(error)}</Alert>}
        {schema && (
          <div className="flex flex-col gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Typography variant="h6" component="h3" className="break-words">
                  {schema.name}
                </Typography>
                {schema.isArchived && <Chip size="small" label={SCHEMAS_MESSAGES.ARCHIVED} />}
              </div>
              <Typography variant="body2" color="text.secondary" className="whitespace-pre-line">
                {schema.description || SCHEMAS_MESSAGES.NO_DESCRIPTION}
              </Typography>
            </div>

            <div className="divide-y divide-slate-200">
              <DetailRow label={SCHEMAS_MESSAGES.SCOPE}>
                {schema.isGlobal ? SCHEMAS_MESSAGES.SCOPE_GLOBAL : SCHEMAS_MESSAGES.SCOPE_PROJECT}
              </DetailRow>
              <DetailRow label={SCHEMAS_MESSAGES.IMPORTS_USING}>
                {schema.importCount ?? 0}
              </DetailRow>
              <DetailRow label={SCHEMAS_MESSAGES.COLUMN_CREATED}>
                {formatDate(schema.createdAt)}
              </DetailRow>
            </div>

            <div>
              <Typography variant="subtitle2" className="mb-2">
                {SCHEMAS_MESSAGES.FIELDS_TITLE}
              </Typography>
              <SchemaFieldsTable fields={schema.fields} />
            </div>
          </div>
        )}
      </DialogContent>
      <DialogActions className="px-6 pb-4">
        <Button onClick={onClose}>{COMMON_MESSAGES.CLOSE}</Button>
      </DialogActions>
    </Dialog>
  );
}
