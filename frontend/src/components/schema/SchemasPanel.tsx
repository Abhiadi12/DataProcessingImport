import AddIcon from "@mui/icons-material/Add";
import ArchiveOutlinedIcon from "@mui/icons-material/ArchiveOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { useState } from "react";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { DataTable } from "@/components/common/DataTable";
import { EmptyState } from "@/components/common/EmptyState";
import { PageLoader } from "@/components/common/PageLoader";
import {
  DEFAULT_PAGE_SIZE,
  PAGE_SIZE_OPTIONS,
  PROJECTS_MESSAGES,
  ROLE,
  SCHEMAS_MESSAGES,
  USERS_MESSAGES,
} from "@/constants";
import { useAppSelector } from "@/hooks/redux.hooks";
import { useNotify } from "@/hooks/useNotify";
import { useArchiveSchema, useGetProjectSchemas } from "@/service/schema.service";
import { selectCurrentUser } from "@/store/slices/auth.slice";
import type { DataTableColumn, ImportSchema, SchemasPanelProps } from "@/types";
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
        if (page && page.items.length === 1 && pageIndex > 0) {
          setPageIndex(pageIndex - 1);
        }
      },
      onError: (error) => notify.error(getApiErrorMessage(error)),
    });
    setArchiving(null);
  };

  const columns: DataTableColumn<ImportSchema>[] = [
    {
      key: "name",
      header: SCHEMAS_MESSAGES.COLUMN_NAME,
      render: (schema) => (
        <span className="flex items-center gap-2">
          {schema.name}
          {schema.isGlobal && (
            <Chip size="small" variant="outlined" color="primary" label={SCHEMAS_MESSAGES.GLOBAL} />
          )}
        </span>
      ),
    },
    {
      key: "fields",
      header: SCHEMAS_MESSAGES.COLUMN_FIELDS,
      render: (schema) => Object.keys(schema.fields).length,
    },
    {
      key: "unique",
      header: SCHEMAS_MESSAGES.COLUMN_UNIQUE,
      className: "font-mono text-sm",
      render: (schema) => schema.uniqueFields.join(", "),
    },
    {
      key: "created",
      header: SCHEMAS_MESSAGES.COLUMN_CREATED,
      className: "whitespace-nowrap",
      render: (schema) => formatDate(schema.createdAt),
    },
    {
      key: "actions",
      header: USERS_MESSAGES.COLUMN_ACTIONS,
      align: "right",
      className: "whitespace-nowrap",
      render: (schema) => (
        <>
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
        </>
      ),
    },
  ];

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

      {/* The empty case has its own, fuller message above, so the table is
          only shown once there is something to list. */}
      {page && page.total > 0 && (
        <DataTable
          label={PROJECTS_MESSAGES.TAB_SCHEMAS}
          columns={columns}
          rows={page.items}
          getRowKey={(schema) => schema.id}
          emptyMessage={SCHEMAS_MESSAGES.EMPTY_TITLE}
          isRefreshing={schemas.isFetching}
          pagination={{
            page: pageIndex,
            pageSize,
            total: page.total,
            pageSizeOptions: PAGE_SIZE_OPTIONS,
            onPageChange: setPageIndex,
            onPageSizeChange: (nextSize) => {
              setPageSize(nextSize);
              setPageIndex(0);
            },
          }}
        />
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
