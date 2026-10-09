import Alert from "@mui/material/Alert";
import Typography from "@mui/material/Typography";
import { StatCard } from "@/components/common/StatCard";
import { ADMIN_DASHBOARD_MESSAGES } from "@/constants";
import type { QueueHealthProps } from "@/types";
import { formatNumber } from "@/utils/format";

export function QueueHealth({ queue }: QueueHealthProps) {
  const show = (value: number) =>
    queue.available ? formatNumber(value) : ADMIN_DASHBOARD_MESSAGES.UNKNOWN;
  const isKnown = queue.available;
  const hasWork = queue.queueSize > 0 || queue.inFlight > 0 || queue.retryQueueSize > 0;

  return (
    <section>
      <Typography variant="h6" component="h2" className="mb-3">
        {ADMIN_DASHBOARD_MESSAGES.QUEUE_TITLE}
      </Typography>

      {!isKnown && (
        <Alert severity="warning" className="mb-4">
          {ADMIN_DASHBOARD_MESSAGES.QUEUE_UNAVAILABLE}
        </Alert>
      )}
      {/* Work waiting with nobody to do it is worth saying out loud. */}
      {isKnown && queue.activeWorkers === 0 && hasWork && (
        <Alert severity="error" className="mb-4">
          {ADMIN_DASHBOARD_MESSAGES.NO_WORKERS}
        </Alert>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard label={ADMIN_DASHBOARD_MESSAGES.QUEUE_SIZE} value={show(queue.queueSize)} />
        <StatCard label={ADMIN_DASHBOARD_MESSAGES.IN_FLIGHT} value={show(queue.inFlight)} />
        <StatCard
          label={ADMIN_DASHBOARD_MESSAGES.ACTIVE_WORKERS}
          value={show(queue.activeWorkers)}
          tone={isKnown && queue.activeWorkers > 0 ? "success" : "default"}
        />
        <StatCard
          label={ADMIN_DASHBOARD_MESSAGES.RETRY_QUEUE}
          value={show(queue.retryQueueSize)}
          tone={isKnown && queue.retryQueueSize > 0 ? "warning" : "default"}
        />
        <StatCard
          label={ADMIN_DASHBOARD_MESSAGES.DEAD_LETTER_QUEUE}
          value={show(queue.deadLetterQueueSize)}
          tone={isKnown && queue.deadLetterQueueSize > 0 ? "error" : "default"}
        />
      </div>
    </section>
  );
}
