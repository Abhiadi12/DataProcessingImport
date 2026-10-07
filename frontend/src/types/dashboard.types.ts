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
  processingSpeed: number | null;
  recentImports: RecentImport[];
  scope: DashboardScope;
}

export interface SystemCounts {
  totalUsers: number;
  activeUsers: number;
  totalProjects: number;
  activeProjects: number;
  // Not counting archived schemas.
  totalSchemas: number;
}

export interface QueueMetrics {
  // Jobs waiting for a worker.
  queueSize: number;
  // Jobs a worker has taken and not finished.
  inFlight: number;
  activeWorkers: number;
  retryQueueSize: number;
  deadLetterQueueSize: number;
  // false = the API could not reach RabbitMQ. The numbers above are then all
  // 0 but mean "unknown", and must not be shown as zeros.
  available: boolean;
}

// GET /admin/dashboard
export interface AdminDashboard extends SystemCounts {
  systemImports: ImportTotals;
  processingSpeed: number | null;
  queue: QueueMetrics;
  recentImports: RecentImport[];
}
