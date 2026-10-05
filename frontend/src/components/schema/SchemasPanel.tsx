import AddIcon from "@mui/icons-material/Add";
import ArchiveOutlinedIcon from "@mui/icons-material/ArchiveOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import LinearProgress from "@mui/material/LinearProgress";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TablePagination from "@mui/material/TablePagination";
import TableRow from "@mui/material/TableRow";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { useState } from "react";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { EmptyState } from "@/components/common/EmptyState";
import { PageLoader } from "@/components/common/PageLoader";
import {
  DEFAULT_PAGE_SIZE,
  PAGE_SIZE_OPTIONS,
  ROLE,
  SCHEMAS_MESSAGES,
  USERS_MESSAGES,
} from "@/constants";
import { useAppSelector } from "@/hooks/redux.hooks";
import { useNotify } from "@/hooks/useNotify";
import { useArchiveSchema, useGetProjectSchemas } from "@/service/schema.service";
import { selectCurrentUser } from "@/store/slices/auth.slice";
import type { ImportSchema, SchemasPanelProps } from "@/types";
import { getApiErrorMessage } from "@/utils/api-error";
import { formatDate } from "@/utils/format";
import { hasRole } from "@/utils/role";
import { SchemaDetailsDialog } from "./SchemaDetailsDialog";
import { SchemaFormDialog } from "./SchemaFormDialog";

// The schemas usable in one project: its own and the global ones.
export function SchemasPanel({ projectId, canManage }: SchemasPanelProps) {
  const isAdmin = hasRole(useAppSelector(selectCurrentUser), ROLE.ADMIN);
  const notify = useNotify();

  // MUI's pagination counts pages from 0; the API counts from 1.
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [formOpen, setFormOpen] = useState(false);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [archiving, setArchiving] = useState<ImportSchema | null>(null);

  const schemas = useGetProjectSchemas(projectId, { page: pageIndex + 1, limit: pageSize });
  const archiveSchema = useArchiveSchema();
  const page = schemas.data?.data;

  // Mirrors the API: a manager can archive this project's schemas, but a
  // global schema only by an admin.
  const canArchive = (schema: ImportSchema) => canManage && (!schema.isGlobal || isAdmin);

  const confirmArchive = () => {
    if (!archiving) {
      return;
    }
    archiveSchema.mutate(archiving.id, {
      onSuccess: (res) => {
        notify.success(res.message);
        // Archiving the only schema on a later page would leave it empty.
        if (page && page.items.length === 1 && pageIndex > 0) {
          setPageIndex(pageIndex - 1);
        }
      },
      // e.g. "That import schema has imports and cannot be archived".
      onError: (error) => notify.error(getApiErrorMessage(error)),
    });
    setArchiving(null);
  };

  const newSchemaButton = canManage && (
    <Button variant="contained" startIcon={<AddIcon />} onClick={() => setFormOpen(true)}>
      {SCHEMAS_MESSAGES.NEW}
    </Button>
  );

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-4">
        <Typography variant="body2" color="text.secondary">
          {SCHEMAS_MESSAGES.INTRO}
        </Typography>
        {newSchemaButton}
      </div>

      {schemas.isPending && <PageLoader />}
      {schemas.isError && (
        <Alert severity="error" className="m-4">
          {getApiErrorMessage(schemas.error)}
        </Alert>
      )}

      {page && page.total === 0 && (
        <EmptyState
          title={SCHEMAS_MESSAGES.EMPTY_TITLE}
          description={
            canManage ? SCHEMAS_MESSAGES.EMPTY_FOR_MANAGER : SCHEMAS_MESSAGES.EMPTY_FOR_MEMBER
          }
        />
      )}

      {page && page.total > 0 && (
        <>
          {/* Shown while a different page is loading behind the current rows. */}
          {schemas.isFetching && <LinearProgress />}
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>{SCHEMAS_MESSAGES.COLUMN_NAME}</TableCell>
                  <TableCell>{SCHEMAS_MESSAGES.COLUMN_FIELDS}</TableCell>
                  <TableCell>{SCHEMAS_MESSAGES.COLUMN_UNIQUE}</TableCell>
                  <TableCell>{SCHEMAS_MESSAGES.COLUMN_CREATED}</TableCell>
                  <TableCell align="right">{USERS_MESSAGES.COLUMN_ACTIONS}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {page.items.map((schema) => (
                  <TableRow key={schema.id} hover>
                    <TableCell>
                      <span className="flex items-center gap-2">
                        {schema.name}
                        {schema.isGlobal && (
                          <Chip
                            size="small"
                            variant="outlined"
                            color="primary"
                            label={SCHEMAS_MESSAGES.GLOBAL}
                          />
                        )}
                      </span>
                    </TableCell>
                    <TableCell>{Object.keys(schema.fields).length}</TableCell>
                    <TableCell className="font-mono text-sm">
                      {schema.uniqueFields.join(", ")}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {formatDate(schema.createdAt)}
                    </TableCell>
                    <TableCell align="right" className="whitespace-nowrap">
                      <Tooltip title={SCHEMAS_MESSAGES.viewDetailsOf(schema.name)}>
                        <IconButton
                          onClick={() => setViewingId(schema.id)}
                          aria-label={SCHEMAS_MESSAGES.viewDetailsOf(schema.name)}
                        >
                          <VisibilityOutlinedIcon />
                        </IconButton>
                      </Tooltip>
                      {canArchive(schema) && (
                        <Tooltip title={SCHEMAS_MESSAGES.archiveLabel(schema.name)}>
                          <IconButton
                            onClick={() => setArchiving(schema)}
                            disabled={archiveSchema.isPending}
                            aria-label={SCHEMAS_MESSAGES.archiveLabel(schema.name)}
                          >
                            <ArchiveOutlinedIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component="div"
            count={page.total}
            page={pageIndex}
            rowsPerPage={pageSize}
            rowsPerPageOptions={PAGE_SIZE_OPTIONS}
            labelRowsPerPage={USERS_MESSAGES.ROWS_PER_PAGE}
            onPageChange={(_event, nextPage) => setPageIndex(nextPage)}
            onRowsPerPageChange={(event) => {
              setPageSize(Number(event.target.value));
              setPageIndex(0);
            }}
          />
        </>
      )}

      <SchemaFormDialog open={formOpen} projectId={projectId} onClose={() => setFormOpen(false)} />
      <SchemaDetailsDialog schemaId={viewingId} onClose={() => setViewingId(null)} />
      <ConfirmDialog
        open={Boolean(archiving)}
        title={SCHEMAS_MESSAGES.ARCHIVE_TITLE}
        description={SCHEMAS_MESSAGES.archiveWarning(archiving?.name ?? "")}
        confirmLabel={SCHEMAS_MESSAGES.ARCHIVE_CONFIRM}
        destructive
        onConfirm={confirmArchive}
        onCancel={() => setArchiving(null)}
      />
    </div>
  );
}
