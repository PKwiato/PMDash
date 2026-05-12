/**
 * Fractional business days in [startMs, endMs), excluding Saturday and Sunday in **UTC**.
 * Each calendar UTC day contributes (overlap_ms / 86400000) if that day is Mon–Fri.
 */
export function businessDaysUtcBetween(startMs: number, endMs: number): number {
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs <= startMs) {
    return 0;
  }

  const DAY_MS = 86_400_000;
  let total = 0;
  let cur = startMs;

  while (cur < endMs) {
    const d = new Date(cur);
    const dayStart = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0);
    const dayEnd = dayStart + DAY_MS;
    const segStart = Math.max(cur, dayStart);
    const segEnd = Math.min(endMs, dayEnd);
    const weekday = new Date(dayStart).getUTCDay();
    if (weekday !== 0 && weekday !== 6) {
      total += (segEnd - segStart) / DAY_MS;
    }
    cur = dayEnd;
  }

  return total;
}
