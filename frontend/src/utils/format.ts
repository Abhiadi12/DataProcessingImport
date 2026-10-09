import { DATE_FORMAT, DATE_LOCALE, DATE_TIME_FORMAT } from "@/constants";

const dateFormatter = new Intl.DateTimeFormat(DATE_LOCALE, DATE_FORMAT);

//INFO: "2026-09-01T10:00:00.000Z" → "01 Sept 2026" (in the viewer's time zone).
export function formatDate(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? "" : dateFormatter.format(date);
}

const dateTimeFormatter = new Intl.DateTimeFormat(DATE_LOCALE, DATE_TIME_FORMAT);
const numberFormatter = new Intl.NumberFormat(DATE_LOCALE);

// INFO: "2026-09-01T10:05:00.000Z" → "01 Sept 2026, 10:05" (in the viewer's time zone).
export function formatDateTime(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? "" : dateTimeFormatter.format(date);
}

// INFO:1234567 → "1,234,567".
export function formatNumber(value: number): string {
  return numberFormatter.format(value);
}
