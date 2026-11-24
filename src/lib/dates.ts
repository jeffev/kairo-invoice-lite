import { format } from "date-fns";

export const formatDate = (date: Date | number) => format(date, "MMM d, yyyy");
export const formatDateInput = (date: Date | number) => format(date, "yyyy-MM-dd");

/** "2026-10-21" → Date at local midnight (invalid → today). */
export function parseDateInput(value: string | null | undefined) {
  if (!value) return startOfToday();
  const [y, m, d] = value.split("-").map(Number);
  const date = new Date(y, (m ?? 1) - 1, d ?? 1);
  return Number.isNaN(date.getTime()) ? startOfToday() : date;
}

export function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function daysBetween(from: Date | number, to: Date | number) {
  return Math.round((new Date(to).getTime() - new Date(from).getTime()) / 86_400_000);
}

export function startOfMonth(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function addMonths(date: Date, months: number) {
  const d = new Date(date);
  const day = d.getDate();
  d.setDate(1);
  d.setMonth(d.getMonth() + months);
  // Clamp to the last day of the target month (Jan 31 + 1 month → Feb 28).
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(day, last));
  return d;
}
