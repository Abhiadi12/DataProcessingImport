import type { ImportStatus } from "./import.types";

// Counts of imports and of the records they handled.
export interface ImportTotals {
  totalImports: number;
  // Uploading, queued or processing.
  activeImports: number;
  completedImports: number;
  failedImports: number;
  recordsProcessed: number;
  successfulRecords: number;
  failedRecords: number;
  duplicateRecords: number;
}

export interface RecentImport {
  id: string;
  filename: string;
  status: ImportStatus;
  projectId: string;
  projectName: string;
  schemaName: string;
  processedRows: number;
  successfulRows: number;
  failedRows: number;
  duplicateRows: number;
  createdAt: string;
  completedAt: string | null;
}

export type DashboardScope = "all-projects" | "my-projects";

// GET /dashboard
export interface Dashboard extends ImportTotals {
  // Rows per second across recent completed imports; null when none have run.
  processingSpeed: number | null;
  recentImports: RecentImport[];
  scope: DashboardScope;
}
