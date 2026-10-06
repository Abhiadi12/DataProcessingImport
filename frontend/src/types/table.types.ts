import type { ReactNode } from "react";

// One column of a DataTable. `render` turns a row into the cell's content, so
// a column can show plain text, a chip, buttons — anything.
export interface DataTableColumn<Row> {
  // Unique among the table's columns; used as the React key.
  key: string;
  header: string;
  render: (row: Row) => ReactNode;
  align?: "left" | "center" | "right";
  // Extra classes for this column's body cells (e.g. "whitespace-nowrap").
  className?: string;
}

// Present → the table shows a pager. The table never slices rows itself:
// `rows` is always the current page, as returned by the API.
export interface DataTablePagination {
  // Zero-based, as MUI counts. (The API counts from 1 — convert at the call.)
  page: number;
  pageSize: number;
  // Total rows across all pages.
  total: number;
  pageSizeOptions: number[];
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

export interface DataTableProps<Row> {
  // Read out by screen readers to identify the table.
  label: string;
  columns: DataTableColumn<Row>[];
  rows: Row[];
  getRowKey: (row: Row) => string;
  // Shown instead of rows when there are none.
  emptyMessage: string;
  // First load: nothing to show yet, so a spinner replaces the table.
  isLoading?: boolean;
  // Loading again with rows already on screen (next page, a refresh): the
  // rows stay and a thin progress bar appears above them.
  isRefreshing?: boolean;
  // When set, replaces the table with an error alert.
  errorMessage?: string | null;
  pagination?: DataTablePagination;
}
