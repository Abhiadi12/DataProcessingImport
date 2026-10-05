import type { NotificationSeverity } from "@/types";

export const NOTIFICATION_SEVERITY = {
  SUCCESS: "success",
  ERROR: "error",
} as const satisfies Record<string, NotificationSeverity>;

export const NOTIFICATION_DURATION_MS = 5_000;
