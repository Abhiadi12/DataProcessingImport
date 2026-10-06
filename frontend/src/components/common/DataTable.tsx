import Alert from "@mui/material/Alert";
import LinearProgress from "@mui/material/LinearProgress";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TablePagination from "@mui/material/TablePagination";
import TableRow from "@mui/material/TableRow";
import { TABLE_MESSAGES } from "@/constants";
import type { DataTableProps } from "@/types";
import { PageLoader } from "./PageLoader";

export function DataTable<Row>({
  label,
  columns,
  rows,
  getRowKey,
  emptyMessage,
  isLoading = false,
  isRefreshing = false,
  errorMessage = null,
  pagination,
}: DataTableProps<Row>) {
  if (errorMessage) {
    return (
      <Alert severity="error" className="m-4">
        {errorMessage}
      </Alert>
    );
  }

  if (isLoading) {
    return <PageLoader />;
  }

  return (
    <div>
      {isRefreshing && <LinearProgress />}
      <TableContainer>
        <Table aria-label={label}>
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell key={column.key} align={column.align}>
                  {column.header}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={columns.length} align="center" className="py-10 text-slate-500">
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}

            {rows.map((row) => (
              <TableRow key={getRowKey(row)} hover>
                {columns.map((column) => (
                  <TableCell key={column.key} align={column.align} className={column.className}>
                    {column.render(row)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {pagination && (
        <TablePagination
          component="div"
          count={pagination.total}
          page={pagination.page}
          rowsPerPage={pagination.pageSize}
          rowsPerPageOptions={pagination.pageSizeOptions}
          labelRowsPerPage={TABLE_MESSAGES.ROWS_PER_PAGE}
          onPageChange={(_event, page) => pagination.onPageChange(page)}
          onRowsPerPageChange={(event) => pagination.onPageSizeChange(Number(event.target.value))}
        />
      )}
    </div>
  );
}
