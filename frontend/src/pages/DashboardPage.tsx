import Alert from "@mui/material/Alert";
import Card from "@mui/material/Card";
import Typography from "@mui/material/Typography";
import { PageLoader } from "@/components/common/PageLoader";
import { ImportTotalsCards } from "@/components/dashboard/ImportTotalsCards";
import { ProcessingSpeed } from "@/components/dashboard/ProcessingSpeed";
import { RecentImportsTable } from "@/components/dashboard/RecentImportsTable";
import { DASHBOARD_MESSAGES } from "@/constants";
import { useGetDashboard } from "@/service/dashboard.service";
import { getApiErrorMessage } from "@/utils/api-error";

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

      <ProcessingSpeed rowsPerSecond={dashboard.processingSpeed} />

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
