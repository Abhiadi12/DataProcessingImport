import Typography from "@mui/material/Typography";
import { StatCard } from "@/components/common/StatCard";
import { DASHBOARD_MESSAGES } from "@/constants";
import type { ImportTotalsCardsProps } from "@/types";
import { formatNumber } from "@/utils/format";

export function ImportTotalsCards({ totals }: ImportTotalsCardsProps) {
  return (
    <div className="flex flex-col gap-6">
      <section>
        <Typography variant="h6" component="h2" className="mb-3">
          {DASHBOARD_MESSAGES.IMPORTS_TITLE}
        </Typography>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            label={DASHBOARD_MESSAGES.TOTAL_IMPORTS}
            value={formatNumber(totals.totalImports)}
          />
          <StatCard
            label={DASHBOARD_MESSAGES.ACTIVE_IMPORTS}
            value={formatNumber(totals.activeImports)}
          />
          <StatCard
            label={DASHBOARD_MESSAGES.COMPLETED_IMPORTS}
            value={formatNumber(totals.completedImports)}
            tone="success"
          />
          <StatCard
            label={DASHBOARD_MESSAGES.FAILED_IMPORTS}
            value={formatNumber(totals.failedImports)}
            tone={totals.failedImports > 0 ? "error" : "default"}
          />
        </div>
      </section>

      <section>
        <Typography variant="h6" component="h2" className="mb-3">
          {DASHBOARD_MESSAGES.RECORDS_TITLE}
        </Typography>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            label={DASHBOARD_MESSAGES.RECORDS_PROCESSED}
            value={formatNumber(totals.recordsProcessed)}
          />
          <StatCard
            label={DASHBOARD_MESSAGES.RECORDS_SUCCESSFUL}
            value={formatNumber(totals.successfulRecords)}
            tone="success"
          />
          <StatCard
            label={DASHBOARD_MESSAGES.RECORDS_FAILED}
            value={formatNumber(totals.failedRecords)}
            tone={totals.failedRecords > 0 ? "error" : "default"}
          />
          <StatCard
            label={DASHBOARD_MESSAGES.RECORDS_DUPLICATE}
            value={formatNumber(totals.duplicateRecords)}
            tone={totals.duplicateRecords > 0 ? "warning" : "default"}
          />
        </div>
      </section>
    </div>
  );
}
