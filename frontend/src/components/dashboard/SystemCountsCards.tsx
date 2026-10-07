import Typography from "@mui/material/Typography";
import { StatCard } from "@/components/common/StatCard";
import { ADMIN_DASHBOARD_MESSAGES } from "@/constants";
import type { SystemCountsCardsProps } from "@/types";
import { formatNumber } from "@/utils/format";

export function SystemCountsCards({ counts }: SystemCountsCardsProps) {
  return (
    <section>
      <Typography variant="h6" component="h2" className="mb-3">
        {ADMIN_DASHBOARD_MESSAGES.SYSTEM_TITLE}
      </Typography>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard label={ADMIN_DASHBOARD_MESSAGES.USERS} value={formatNumber(counts.totalUsers)} />
        <StatCard
          label={ADMIN_DASHBOARD_MESSAGES.ACTIVE_USERS}
          value={formatNumber(counts.activeUsers)}
        />
        <StatCard
          label={ADMIN_DASHBOARD_MESSAGES.PROJECTS}
          value={formatNumber(counts.totalProjects)}
        />
        <StatCard
          label={ADMIN_DASHBOARD_MESSAGES.ACTIVE_PROJECTS}
          value={formatNumber(counts.activeProjects)}
        />
        <StatCard
          label={ADMIN_DASHBOARD_MESSAGES.SCHEMAS}
          value={formatNumber(counts.totalSchemas)}
        />
      </div>
    </section>
  );
}
