export type NotificationSeverity = "success" | "error";

export interface NotificationState {
  open: boolean;
  message: string;
  severity: NotificationSeverity;
}

export interface NotificationPayload {
  message: string;
  severity: NotificationSeverity;
}
