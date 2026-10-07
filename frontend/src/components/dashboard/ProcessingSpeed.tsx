import Typography from "@mui/material/Typography";
import { StatCard } from "@/components/common/StatCard";
import { DASHBOARD_MESSAGES, IMPORT_DETAIL_MESSAGES } from "@/constants";
import type { ProcessingSpeedProps } from "@/types";
import { formatNumber } from "@/utils/format";

export function ProcessingSpeed({ rowsPerSecond }: ProcessingSpeedProps) {
  return (
    <section>
      <Typography variant="h6" component="h2" className="mb-3">
        {DASHBOARD_MESSAGES.SPEED_TITLE}
      </Typography>
      <div className="grid gap-4 lg:grid-cols-4">
        <StatCard
          label={DASHBOARD_MESSAGES.SPEED_HINT}
          value={
            rowsPerSecond === null
              ? DASHBOARD_MESSAGES.NO_SPEED
              : IMPORT_DETAIL_MESSAGES.rowsPerSecond(formatNumber(Math.round(rowsPerSecond)))
          }
        />
      </div>
    </section>
  );
}
