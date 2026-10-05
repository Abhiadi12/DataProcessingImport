import { DATE_FORMAT, DATE_LOCALE } from "@/constants";

const dateFormatter = new Intl.DateTimeFormat(DATE_LOCALE, DATE_FORMAT);

//INFO: "2026-09-01T10:00:00.000Z" → "01 Sept 2026" (in the viewer's time zone).
export function formatDate(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? "" : dateFormatter.format(date);
}
