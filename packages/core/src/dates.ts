/**
 * Get today's date as a YYYY-MM-DD string in the **local** timezone.
 *
 * This avoids the common pitfall of using `new Date().toISOString().slice(0, 10)`,
 * which returns the UTC date and can be wrong when the local time is ahead of
 * or behind UTC (e.g., 11pm ET on March 6 → "2026-03-07" in UTC).
 */
export function localToday(): string {
  return localDateString(new Date());
}

/**
 * Format a Date object as YYYY-MM-DD in the **local** timezone.
 */
export function localDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Add (or subtract) days from a date string, returning a new YYYY-MM-DD string.
 * All arithmetic is done in local time.
 */
export function addDays(dateStr: string, days: number): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const d = new Date(year, month - 1, day);
  d.setDate(d.getDate() + days);
  return localDateString(d);
}
