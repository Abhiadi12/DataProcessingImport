import { ImportStatus, type PrismaClient } from "@prisma/client";

export interface ImportTotals {
  totalImports: number;
  activeImports: number;
  completedImports: number;
  failedImports: number;
  recordsProcessed: number;
  successfulRecords: number;
  failedRecords: number;
  duplicateRecords: number;
}

export interface RecentImportRow {
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
  createdAt: Date;
  completedAt: Date | null;
}

export interface SystemCounts {
  totalUsers: number;
  activeUsers: number;
  totalProjects: number;
  activeProjects: number;
  totalSchemas: number;
}

/** Statuses that mean "work is in flight right now". */
const ACTIVE_STATUSES: ImportStatus[] = [
  ImportStatus.UPLOADING,
  ImportStatus.QUEUED,
  ImportStatus.PROCESSING,
];

export class DashboardRepository {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Every headline number in ONE round trip.
   *
   * `groupBy` returns a row per status carrying both the count and the summed
   * counters, so the four import tallies and the four record tallies all come
   * from a single scan. The obvious alternative — eight `count`/`aggregate`
   * calls — would be eight queries over the same rows.
   *
   * `projectIds` of `null` means system-wide (admin); an empty array means the
   * caller belongs to no projects, which must return zeros rather than
   * everything.
   */
  async importTotals(projectIds: string[] | null): Promise<ImportTotals> {
    if (projectIds !== null && projectIds.length === 0) {
      return {
        totalImports: 0,
        activeImports: 0,
        completedImports: 0,
        failedImports: 0,
        recordsProcessed: 0,
        successfulRecords: 0,
        failedRecords: 0,
        duplicateRecords: 0,
      };
    }

    const where = projectIds === null ? {} : { projectId: { in: projectIds } };

    const grouped = await this.prisma.import.groupBy({
      by: ["status"],
      where,
      _count: { _all: true },
      _sum: {
        processedRows: true,
        successfulRows: true,
        failedRows: true,
        duplicateRows: true,
      },
    });

    const totals: ImportTotals = {
      totalImports: 0,
      activeImports: 0,
      completedImports: 0,
      failedImports: 0,
      recordsProcessed: 0,
      successfulRecords: 0,
      failedRecords: 0,
      duplicateRecords: 0,
    };

    for (const row of grouped) {
      totals.totalImports += row._count._all;
      if (ACTIVE_STATUSES.includes(row.status)) totals.activeImports += row._count._all;
      if (row.status === ImportStatus.COMPLETED) totals.completedImports += row._count._all;
      if (row.status === ImportStatus.FAILED) totals.failedImports += row._count._all;

      totals.recordsProcessed += row._sum.processedRows ?? 0;
      totals.successfulRecords += row._sum.successfulRows ?? 0;
      totals.failedRecords += row._sum.failedRows ?? 0;
      totals.duplicateRecords += row._sum.duplicateRows ?? 0;
    }

    return totals;
  }

  /**
   * Rows/sec across imports that have actually run.
   *
   * Measured from `startedAt`, not `createdAt`: the upload and the time spent
   * waiting in the queue are not processing time, and including them would
   * understate throughput — badly, for a file that sat queued behind others.
   */
  async processingSpeed(projectIds: string[] | null): Promise<number | null> {
    if (projectIds !== null && projectIds.length === 0) return null;

    const rows = await this.prisma.import.findMany({
      where: {
        ...(projectIds === null ? {} : { projectId: { in: projectIds } }),
        status: ImportStatus.COMPLETED,
        startedAt: { not: null },
        completedAt: { not: null },
      },
      select: { processedRows: true, startedAt: true, completedAt: true },
      orderBy: { completedAt: "desc" },
      take: 20,
    });

    let rowsTotal = 0;
    let secondsTotal = 0;
    for (const row of rows) {
      if (!row.startedAt || !row.completedAt) continue;
      const seconds = (row.completedAt.getTime() - row.startedAt.getTime()) / 1000;
      if (seconds <= 0) continue;
      rowsTotal += row.processedRows;
      secondsTotal += seconds;
    }

    return secondsTotal > 0 ? Math.round(rowsTotal / secondsTotal) : null;
  }

  async recentImports(projectIds: string[] | null, take: number): Promise<RecentImportRow[]> {
    if (projectIds !== null && projectIds.length === 0) return [];

    const rows = await this.prisma.import.findMany({
      where: projectIds === null ? {} : { projectId: { in: projectIds } },
      orderBy: { createdAt: "desc" },
      take,
      include: {
        project: { select: { name: true } },
        schema: { select: { name: true } },
      },
    });

    return rows.map((row) => ({
      id: row.id,
      filename: row.filename,
      status: row.status,
      projectId: row.projectId,
      projectName: row.project.name,
      schemaName: row.schema.name,
      processedRows: row.processedRows,
      successfulRows: row.successfulRows,
      failedRows: row.failedRows,
      duplicateRows: row.duplicateRows,
      createdAt: row.createdAt,
      completedAt: row.completedAt,
    }));
  }

  /** Project ids the caller can see. Used to scope the non-admin dashboard. */
  async projectIdsForMember(userId: string): Promise<string[]> {
    const rows = await this.prisma.projectMember.findMany({
      where: { userId },
      select: { projectId: true },
    });
    return rows.map((row) => row.projectId);
  }

  /** Admin-only platform counts, batched into one transaction. */
  async systemCounts(): Promise<SystemCounts> {
    const [totalUsers, activeUsers, totalProjects, activeProjects, totalSchemas] =
      await this.prisma.$transaction([
        this.prisma.user.count(),
        this.prisma.user.count({ where: { isActive: true } }),
        this.prisma.project.count(),
        // "Active" means a project that has ever run an import — a project
        // nobody has used is not meaningfully active.
        this.prisma.project.count({ where: { imports: { some: {} } } }),
        this.prisma.importSchema.count({ where: { archivedAt: null } }),
      ]);

    return { totalUsers, activeUsers, totalProjects, activeProjects, totalSchemas };
  }
}
