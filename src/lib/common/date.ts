/** Date helpers for timezone-safe display and form inputs. */

/** Parse YYYY-MM-DD (or Date) as a local calendar date. */
export function parseDateLocal(dateValue: string | Date): Date {
  if (dateValue instanceof Date) {
    return new Date(dateValue.getFullYear(), dateValue.getMonth(), dateValue.getDate());
  }
  const [year, month, day] = dateValue.split("-").map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1);
}

/** Format a date-only value for display without timezone day-shift (UTC). */
export function formatDateOnly(value?: string | Date | null, locale = "en-US"): string {
  if (value == null || value === "") return "—";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString(locale, { timeZone: "UTC" });
}

/** Format a datetime for display in local timezone. */
export function formatDateTime(value?: string | Date | null, locale = "en-US"): string {
  if (value == null || value === "") return "—";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString(locale);
}

/** Value for `<input type="date">` from a Date/ISO string (UTC date parts). */
export function toDateInputValue(value?: string | Date | null): string {
  if (value == null || value === "") return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().split("T")[0] ?? "";
}
