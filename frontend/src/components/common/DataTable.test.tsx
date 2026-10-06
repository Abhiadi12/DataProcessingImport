import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { TABLE_MESSAGES } from "@/constants";
import type { DataTableColumn, DataTablePagination, DataTableProps } from "@/types";
import { DataTable } from "./DataTable";

interface Fruit {
  id: string;
  name: string;
  stock: number;
}

const fruits: Fruit[] = [
  { id: "a", name: "Apple", stock: 12 },
  { id: "b", name: "Banana", stock: 0 },
];

const columns: DataTableColumn<Fruit>[] = [
  { key: "name", header: "Name", render: (fruit) => fruit.name },
  {
    key: "stock",
    header: "In stock",
    align: "right",
    className: "stock-cell",
    render: (fruit) => <strong>{fruit.stock}</strong>,
  },
];

function buildPagination(overrides: Partial<DataTablePagination> = {}): DataTablePagination {
  return {
    page: 0,
    pageSize: 10,
    total: 25,
    pageSizeOptions: [10, 25],
    onPageChange: vi.fn(),
    onPageSizeChange: vi.fn(),
    ...overrides,
  };
}

function renderTable(props: Partial<DataTableProps<Fruit>> = {}) {
  return render(
    <DataTable
      label="Fruit"
      columns={columns}
      rows={fruits}
      getRowKey={(fruit) => fruit.id}
      emptyMessage="No fruit."
      {...props}
    />,
  );
}

// Body rows only: the first row of the table is the header.
const bodyRows = () => screen.getAllByRole("row").slice(1);

describe("DataTable", () => {
  describe("rows and columns", () => {
    it("is labelled for screen readers", () => {
      renderTable();

      expect(screen.getByRole("table", { name: "Fruit" })).toBeInTheDocument();
    });

    it("renders a header for every column, in order", () => {
      renderTable();

      const headers = screen.getAllByRole("columnheader").map((header) => header.textContent);
      expect(headers).toEqual(["Name", "In stock"]);
    });

    it("renders one row per item, with each column's render output", () => {
      renderTable();

      const rows = bodyRows();
      expect(rows).toHaveLength(2);
      expect(within(rows[0]!).getByText("Apple")).toBeInTheDocument();
      expect(within(rows[0]!).getByText("12")).toBeInTheDocument();
      expect(within(rows[1]!).getByText("Banana")).toBeInTheDocument();
    });

    it("renders whatever a column returns, not just text", () => {
      renderTable();

      // The stock column returns a <strong> element.
      expect(screen.getByText("12").tagName).toBe("STRONG");
    });

    it("applies a column's className to its body cells only", () => {
      renderTable();

      expect(screen.getByText("12").closest("td")).toHaveClass("stock-cell");
      expect(screen.getByRole("columnheader", { name: "In stock" })).not.toHaveClass("stock-cell");
    });
  });

  describe("empty, loading and error states", () => {
    it("shows the empty message across all columns when there are no rows", () => {
      renderTable({ rows: [] });

      const cell = screen.getByText("No fruit.");
      expect(cell).toHaveAttribute("colspan", String(columns.length));
      // Headers stay, so the user can still see what the table would hold.
      expect(screen.getAllByRole("columnheader")).toHaveLength(2);
    });

    it("does not show the empty message when there are rows", () => {
      renderTable();

      expect(screen.queryByText("No fruit.")).not.toBeInTheDocument();
    });

    it("shows a spinner instead of the table on first load", () => {
      renderTable({ isLoading: true, rows: [] });

      expect(screen.getByRole("progressbar")).toBeInTheDocument();
      expect(screen.queryByRole("table")).not.toBeInTheDocument();
      // "Loading" must not be mistaken for "empty".
      expect(screen.queryByText("No fruit.")).not.toBeInTheDocument();
    });

    it("keeps the rows and adds a progress bar while refreshing", () => {
      renderTable({ isRefreshing: true });

      expect(screen.getByRole("progressbar")).toBeInTheDocument();
      expect(screen.getByText("Apple")).toBeInTheDocument();
    });

    it("shows no progress bar when idle", () => {
      renderTable();

      expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
    });

    it("shows the error instead of the table", () => {
      renderTable({ errorMessage: "Could not load fruit" });

      expect(screen.getByRole("alert")).toHaveTextContent("Could not load fruit");
      expect(screen.queryByRole("table")).not.toBeInTheDocument();
    });

    it("prefers the error over the loading state", () => {
      renderTable({ errorMessage: "Could not load fruit", isLoading: true });

      expect(screen.getByRole("alert")).toBeInTheDocument();
      expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
    });
  });

  describe("pagination", () => {
    it("shows no pager unless pagination is given", () => {
      renderTable();

      expect(screen.queryByText(TABLE_MESSAGES.ROWS_PER_PAGE)).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /next page/i })).not.toBeInTheDocument();
    });

    it("shows the range of rows on the current page out of the total", () => {
      renderTable({ pagination: buildPagination() });

      expect(screen.getByText(TABLE_MESSAGES.ROWS_PER_PAGE)).toBeInTheDocument();
      expect(screen.getByText("1–10 of 25")).toBeInTheDocument();
    });

    it("reports the next page when Next is clicked", async () => {
      const pagination = buildPagination();
      renderTable({ pagination });

      await userEvent.click(screen.getByRole("button", { name: /next page/i }));

      expect(pagination.onPageChange).toHaveBeenCalledWith(1);
    });

    it("reports the previous page when Previous is clicked", async () => {
      const pagination = buildPagination({ page: 1 });
      renderTable({ pagination });

      await userEvent.click(screen.getByRole("button", { name: /previous page/i }));

      expect(pagination.onPageChange).toHaveBeenCalledWith(0);
    });

    it("disables Previous on the first page and Next on the last", () => {
      const { unmount } = renderTable({ pagination: buildPagination({ page: 0 }) });
      expect(screen.getByRole("button", { name: /previous page/i })).toBeDisabled();
      expect(screen.getByRole("button", { name: /next page/i })).toBeEnabled();
      unmount();

      // 25 rows at 10 per page: page index 2 is the last.
      renderTable({ pagination: buildPagination({ page: 2 }) });
      expect(screen.getByRole("button", { name: /next page/i })).toBeDisabled();
      expect(screen.getByRole("button", { name: /previous page/i })).toBeEnabled();
    });

    it("reports the new page size as a number when it is changed", async () => {
      const pagination = buildPagination();
      renderTable({ pagination });

      await userEvent.click(screen.getByRole("combobox"));
      await userEvent.click(screen.getByRole("option", { name: "25" }));

      expect(pagination.onPageSizeChange).toHaveBeenCalledWith(25);
    });

    it("still shows the pager when the page is empty", () => {
      renderTable({ rows: [], pagination: buildPagination({ total: 0 }) });

      expect(screen.getByText("No fruit.")).toBeInTheDocument();
      expect(screen.getByText("0–0 of 0")).toBeInTheDocument();
    });
  });
});
