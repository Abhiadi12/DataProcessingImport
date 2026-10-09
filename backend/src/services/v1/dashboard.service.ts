import { Role } from "@prisma/client";
import { DASHBOARD_RECENT_IMPORTS } from "../../constants/index.js";
import type {
  DashboardRepository,
  ImportTotals,
  RecentImportRow,
  SystemCounts,
} from "../../repositories/v1/dashboard.repository.js";
import type { AuthenticatedUser } from "./auth.service.js";
import type { QueueMetrics, QueueMetricsService } from "./queue-metrics.service.js";

export interface DashboardView extends ImportTotals {
  /** Rows/sec across recent completed imports; null when none have run. */
  processingSpeed: number | null;
  recentImports: RecentImportRow[];
  /** How the numbers were scoped, so the UI can label them honestly. */
  scope: "all-projects" | "my-projects";
}

export interface AdminDashboardView extends SystemCounts {
  systemImports: ImportTotals;
  processingSpeed: number | null;
  queue: QueueMetrics;
  recentImports: RecentImportRow[];
}

export class DashboardService {
  constructor(
    private readonly dashboardRepository: DashboardRepository,
    private readonly queueMetricsService: QueueMetricsService,
  ) {}

  /**
   * The caller's dashboard (brief §4).
   *
   * Scoped to the projects they belong to — except for ADMIN, who bypasses
   * membership everywhere else in this codebase and so would find a dashboard
   * that hid most of the platform confusing. `scope` is returned so the UI can
   * say which it is showing rather than implying one and meaning the other.
   */
  async getDashboard(user: AuthenticatedUser): Promise<DashboardView> {
    const projectIds =
      user.role === Role.ADMIN ? null : await this.dashboardRepository.projectIdsForMember(user.id);

    // Independent reads, so they run concurrently rather than in series.
    const [totals, processingSpeed, recentImports] = await Promise.all([
      this.dashboardRepository.importTotals(projectIds),
      this.dashboardRepository.processingSpeed(projectIds),
      this.dashboardRepository.recentImports(projectIds, DASHBOARD_RECENT_IMPORTS),
    ]);

    return {
      ...totals,
      processingSpeed,
      recentImports,
      scope: projectIds === null ? "all-projects" : "my-projects",
    };
  }

  /** Admin-only platform view. Queue numbers come from the broker, not our tables. */
  async getAdminDashboard(): Promise<AdminDashboardView> {
    const [counts, systemImports, processingSpeed, queue, recentImports] = await Promise.all([
      this.dashboardRepository.systemCounts(),
      this.dashboardRepository.importTotals(null),
      this.dashboardRepository.processingSpeed(null),
      this.queueMetricsService.read(),
      this.dashboardRepository.recentImports(null, DASHBOARD_RECENT_IMPORTS),
    ]);

    return { ...counts, systemImports, processingSpeed, queue, recentImports };
  }
}
