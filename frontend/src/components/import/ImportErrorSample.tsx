import Typography from "@mui/material/Typography";
import { DataTable } from "@/components/common/DataTable";
import { IMPORT_DETAIL_MESSAGES } from "@/constants";
import type { DataTableColumn, ImportErrorSampleProps, ImportErrorSampleRow } from "@/types";
import { formatNumber } from "@/utils/format";

const COLUMNS: DataTableColumn<ImportErrorSampleRow>[] = [
  {
    key: "row",
    header: IMPORT_DETAIL_MESSAGES.ERROR_ROW,
    className: "align-top",
    render: (row) => formatNumber(row.rowNumber),
  },
  {
    key: "problems",
    header: IMPORT_DETAIL_MESSAGES.ERROR_PROBLEMS,
    className: "align-top",
    render: (row) => (
      <ul className="m-0 list-none p-0">
        {row.errors.map((problem) => (
          <li key={`${problem.field}:${problem.message}`}>
            {IMPORT_DETAIL_MESSAGES.fieldProblem(problem.field, problem.message)}
          </li>
        ))}
      </ul>
    ),
  },
  {
    key: "raw",
    header: IMPORT_DETAIL_MESSAGES.ERROR_RAW,
    className: "align-top",
    render: (row) => (
      <Typography
        component="code"
        variant="body2"
        className="block max-w-md truncate font-mono"
        title={row.rawRow}
      >
        {row.rawRow}
      </Typography>
    ),
  },
];

// The first few rows the import rejected, with the reason for each.
export function ImportErrorSample({ rows }: ImportErrorSampleProps) {
  return (
    <DataTable
      label={IMPORT_DETAIL_MESSAGES.ERRORS_TITLE}
      columns={COLUMNS}
      rows={rows}
      getRowKey={(row) => String(row.rowNumber)}
      emptyMessage={IMPORT_DETAIL_MESSAGES.ERRORS_EMPTY}
    />
  );
}
