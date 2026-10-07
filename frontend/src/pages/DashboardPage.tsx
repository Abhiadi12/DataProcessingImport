import Alert from "@mui/material/Alert";
import Card from "@mui/material/Card";
import Typography from "@mui/material/Typography";
import { PageLoader } from "@/components/common/PageLoader";
import { StatCard } from "@/components/common/StatCard";
import { ImportTotalsCards } from "@/components/dashboard/ImportTotalsCards";
import { RecentImportsTable } from "@/components/dashboard/RecentImportsTable";
import { DASHBOARD_MESSAGES, IMPORT_DETAIL_MESSAGES } from "@/constants";
import { useGetDashboard } from "@/service/dashboard.service";
import { getApiErrorMessage } from "@/utils/api-error";
import { formatNumber } from "@/utils/format";

export function DashboardPage() {
  const { data, isPending, isError, error } = useGetDashboard();
  const dashboard = data?.data;

  if (isPending) {
    return <PageLoader />;
  }

  if (isError || !dashboard) {
    return <Alert severity="error">{getApiErrorMessage(error)}</Alert>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Typography variant="h4" component="h1" className="font-semibold">
          {DASHBOARD_MESSAGES.TITLE}
        </Typography>
        <Typography color="text.secondary" className="mt-1">
          {dashboard.scope === "all-projects"
            ? DASHBOARD_MESSAGES.SCOPE_ALL
            : DASHBOARD_MESSAGES.SCOPE_MINE}
        </Typography>
      </div>

      <ImportTotalsCards totals={dashboard} />

      <section>
        <Typography variant="h6" component="h2" className="mb-3">
          {DASHBOARD_MESSAGES.SPEED_TITLE}
        </Typography>
        <div className="grid gap-4 lg:grid-cols-4">
          <StatCard
            label={DASHBOARD_MESSAGES.SPEED_HINT}
            value={
              dashboard.processingSpeed === null
                ? DASHBOARD_MESSAGES.NO_SPEED
                : IMPORT_DETAIL_MESSAGES.rowsPerSecond(
                    formatNumber(Math.round(dashboard.processingSpeed)),
                  )
            }
          />
        </div>
      </section>

      <section>
        <Typography variant="h6" component="h2" className="mb-3">
          {DASHBOARD_MESSAGES.RECENT_TITLE}
        </Typography>
        <Card>
          <RecentImportsTable imports={dashboard.recentImports} />
        </Card>
      </section>
    </div>
  );
}
