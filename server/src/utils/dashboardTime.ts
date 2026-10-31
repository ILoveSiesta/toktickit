/**
 * TokTickIT Lab 4 - Dashboard Timezone & Boundary Utilities
 * Business Time Zone: Asia/Bangkok (UTC+7)
 * Daily Cut-off: 00:00:00 - 23:59:59
 */

export interface BangkokDateBoundaries {
  todayStart: Date;
  todayEnd: Date;
  yesterdayStart: Date;
  yesterdayEnd: Date;
  thirtyDaysAgo: Date;
}

/**
 * Returns precise UTC Date objects representing the date boundaries
 * in Asia/Bangkok (UTC+7) timezone for a given reference date.
 */
export function getBangkokDateBoundaries(referenceDate: Date = new Date()): BangkokDateBoundaries {
  // Format year, month, day in Asia/Bangkok
  const bkkFormatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const bkkDateString = bkkFormatter.format(referenceDate); // "YYYY-MM-DD"
  const [yearStr, monthStr, dayStr] = bkkDateString.split("-");
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const day = parseInt(dayStr, 10);

  // UTC offset for Asia/Bangkok is +7 hours (+25200000 ms)
  const BANGKOK_OFFSET_MS = 7 * 60 * 60 * 1000;

  // 00:00:00.000 Bangkok time in UTC
  const todayStartMs = Date.UTC(year, month - 1, day, 0, 0, 0, 0) - BANGKOK_OFFSET_MS;
  const todayStart = new Date(todayStartMs);

  // 23:59:59.999 Bangkok time in UTC
  const todayEndMs = Date.UTC(year, month - 1, day, 23, 59, 59, 999) - BANGKOK_OFFSET_MS;
  const todayEnd = new Date(todayEndMs);

  // Yesterday start & end
  const yesterdayStartMs = todayStartMs - 24 * 60 * 60 * 1000;
  const yesterdayStart = new Date(yesterdayStartMs);

  const yesterdayEndMs = todayStartMs - 1;
  const yesterdayEnd = new Date(yesterdayEndMs);

  // 30 calendar days ago from start of today
  const thirtyDaysAgoMs = todayStartMs - 30 * 24 * 60 * 60 * 1000;
  const thirtyDaysAgo = new Date(thirtyDaysAgoMs);

  return {
    todayStart,
    todayEnd,
    yesterdayStart,
    yesterdayEnd,
    thirtyDaysAgo,
  };
}

/**
 * Formats difference as string trend (+X, -X, or 0)
 */
export function formatTrend(diff: number): string {
  if (diff > 0) return `+${diff}`;
  if (diff < 0) return `${diff}`;
  return "0";
}
