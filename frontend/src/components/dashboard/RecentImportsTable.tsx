import Link from "@mui/material/Link";
import { Link as RouterLink } from "react-router";
import { DataTable } from "@/components/common/DataTable";
import { ImportStatusChip } from "@/components/import/ImportStatusChip";
import { DASHBOARD_MESSAGES, importPath, projectImportsPath } from "@/constants";
import type { DataTableColumn, RecentImport, RecentImportsTableProps } from "@/types";
import { formatDateTime, formatNumber } from "@/utils/format";

const COLUMNS: DataTableColumn<RecentImport>[] = [
  {
    key: "file",
    header: DASHBOARD_MESSAGES.COLUMN_FILE,
    render: (item) => (
      <Link
        component={RouterLink}
        to={importPath(item.id)}
        underline="hover"
        className="block max-w-56 truncate font-medium"
        title={item.filename}
      >
        {item.filename}
      </Link>
    ),
  },
  {
    key: "project",
    header: DASHBOARD_MESSAGES.COLUMN_PROJECT,
    render: (item) => (
      <Link
        component={RouterLink}
        to={projectImportsPath(item.projectId)}
        underline="hover"
        color="inherit"
        className="block max-w-48 truncate"
        title={item.projectName}
      >
        {item.projectName}
      </Link>
    ),
  },
  { key: "schema", header: DASHBOARD_MESSAGES.COLUMN_SCHEMA, render: (item) => item.schemaName },
  {
    key: "status",
    header: DASHBOARD_MESSAGES.COLUMN_STATUS,
    render: (item) => <ImportStatusChip status={item.status} />,
  },
  {
    key: "processed",
    header: DASHBOARD_MESSAGES.COLUMN_PROCESSED,
    align: "right",
    render: (item) => formatNumber(item.processedRows),
  },
  {
    key: "successful",
    header: DASHBOARD_MESSAGES.COLUMN_SUCCESSFUL,
    align: "right",
    render: (item) => formatNumber(item.successfulRows),
  },
  {
    key: "failed",
    header: DASHBOARD_MESSAGES.COLUMN_FAILED,
    align: "right",
    render: (item) => formatNumber(item.failedRows),
  },
  {
    key: "duplicates",
    header: DASHBOARD_MESSAGES.COLUMN_DUPLICATES,
    align: "right",
    render: (item) => formatNumber(item.duplicateRows),
  },
  {
    key: "uploaded",
    header: DASHBOARD_MESSAGES.COLUMN_UPLOADED,
    className: "whitespace-nowrap",
    render: (item) => formatDateTime(item.createdAt),
  },
];

// The latest imports, newest first. No pager: the API returns a fixed handful.
export function RecentImportsTable({ imports }: RecentImportsTableProps) {
  return (
    <DataTable
      label={DASHBOARD_MESSAGES.RECENT_TITLE}
      columns={COLUMNS}
      rows={imports}
      getRowKey={(item) => item.id}
      emptyMessage={DASHBOARD_MESSAGES.RECENT_EMPTY}
    />
  );
}
