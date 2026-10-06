import MenuItem from "@mui/material/MenuItem";
import Typography from "@mui/material/Typography";
import { useState } from "react";
import { DataTable } from "@/components/common/DataTable";
import { Input } from "@/components/common/Input";
import {
  ALL_STATUSES,
  DEFAULT_PAGE_SIZE,
  IMPORT_STATUS_LABELS,
  IMPORT_STATUSES,
  IMPORTS_MESSAGES,
  PAGE_SIZE_OPTIONS,
} from "@/constants";
import { useGetProjectImports } from "@/service/import.service";
import type {
  DataTableColumn,
  ImportHistoryTableProps,
  ImportListItem,
  ImportStatus,
} from "@/types";
import { getApiErrorMessage } from "@/utils/api-error";
import { formatBytes } from "@/utils/file";
import { formatDateTime, formatNumber } from "@/utils/format";
import { ImportStatusChip } from "./ImportStatusChip";

const COLUMNS: DataTableColumn<ImportListItem>[] = [
  {
    key: "file",
    header: IMPORTS_MESSAGES.COLUMN_FILE,
    render: (item) => (
      <div className="max-w-64">
        <Typography variant="body2" className="truncate font-medium" title={item.filename}>
          {item.filename}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {formatBytes(item.sizeBytes)}
        </Typography>
      </div>
    ),
  },
  { key: "schema", header: IMPORTS_MESSAGES.COLUMN_SCHEMA, render: (item) => item.schemaName },
  {
    key: "status",
    header: IMPORTS_MESSAGES.COLUMN_STATUS,
    render: (item) => <ImportStatusChip status={item.status} />,
  },
  {
    key: "processed",
    header: IMPORTS_MESSAGES.COLUMN_PROCESSED,
    align: "right",
    render: (item) => formatNumber(item.processedRows),
  },
  {
    key: "successful",
    header: IMPORTS_MESSAGES.COLUMN_SUCCESSFUL,
    align: "right",
    render: (item) => formatNumber(item.successfulRows),
  },
  {
    key: "failed",
    header: IMPORTS_MESSAGES.COLUMN_FAILED,
    align: "right",
    render: (item) => formatNumber(item.failedRows),
  },
  {
    key: "duplicates",
    header: IMPORTS_MESSAGES.COLUMN_DUPLICATES,
    align: "right",
    render: (item) => formatNumber(item.duplicateRows),
  },
  {
    key: "uploadedBy",
    header: IMPORTS_MESSAGES.COLUMN_UPLOADED_BY,
    render: (item) => item.uploadedByName,
  },
  {
    key: "uploaded",
    header: IMPORTS_MESSAGES.COLUMN_UPLOADED,
    className: "whitespace-nowrap",
    render: (item) => formatDateTime(item.createdAt),
  },
];

// A project's imports, newest first, with a status filter.
export function ImportHistoryTable({ projectId }: ImportHistoryTableProps) {
  // MUI's pagination counts pages from 0; the API counts from 1.
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [status, setStatus] = useState<ImportStatus | typeof ALL_STATUSES>(ALL_STATUSES);

  const imports = useGetProjectImports(projectId, {
    page: pageIndex + 1,
    limit: pageSize,
    ...(status === ALL_STATUSES ? {} : { status }),
  });
  const page = imports.data?.data;

  return (
    <div>
      <div className="border-b border-slate-200 p-4">
        <Input
          select
          size="small"
          fullWidth={false}
          label={IMPORTS_MESSAGES.STATUS_FILTER}
          value={status}
          onChange={(event) => {
            setStatus(event.target.value as ImportStatus | typeof ALL_STATUSES);
            // A different filter is a different list — start from its first page.
            setPageIndex(0);
          }}
          className="min-w-48"
        >
          <MenuItem value={ALL_STATUSES}>{IMPORTS_MESSAGES.ALL_STATUSES}</MenuItem>
          {IMPORT_STATUSES.map((option) => (
            <MenuItem key={option} value={option}>
              {IMPORT_STATUS_LABELS[option]}
            </MenuItem>
          ))}
        </Input>
      </div>

      <DataTable
        label={IMPORTS_MESSAGES.TABLE_LABEL}
        columns={COLUMNS}
        rows={page?.items ?? []}
        getRowKey={(item) => item.id}
        emptyMessage={
          status === ALL_STATUSES ? IMPORTS_MESSAGES.EMPTY : IMPORTS_MESSAGES.EMPTY_FOR_STATUS
        }
        isLoading={imports.isPending}
        // isPlaceholderData = a different page or filter is loading. Background
        // polling is deliberately not shown, or the bar would flash every few
        // seconds while an import runs.
        isRefreshing={imports.isPlaceholderData}
        errorMessage={imports.isError ? getApiErrorMessage(imports.error) : null}
        pagination={{
          page: pageIndex,
          pageSize,
          total: page?.total ?? 0,
          pageSizeOptions: PAGE_SIZE_OPTIONS,
          onPageChange: setPageIndex,
          onPageSizeChange: (nextSize) => {
            setPageSize(nextSize);
            setPageIndex(0);
          },
        }}
      />
    </div>
  );
}
