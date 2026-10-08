import { describe, it, expect } from "vitest";
import { getBangkokDateBoundaries, formatTrend } from "../../src/utils/dashboardTime.js";

describe("UNIT-03: Timezone & Date Boundary metric calculations", () => {
  it("calculates accurate Asia/Bangkok (UTC+7) start and end boundaries for today", () => {
    // 2026-10-06 14:30:00 UTC -> 2026-10-06 21:30:00 in Bangkok (UTC+7)
    const refDate = new Date("2026-10-06T14:30:00.000Z");
    const { todayStart, todayEnd, yesterdayStart, yesterdayEnd, thirtyDaysAgo } =
      getBangkokDateBoundaries(refDate);

    // Bangkok 2026-10-06 00:00:00 is UTC 2026-10-05 17:00:00
    expect(todayStart.toISOString()).toBe("2026-10-05T17:00:00.000Z");

    // Bangkok 2026-10-06 23:59:59.999 is UTC 2026-10-06 16:59:59.999
    expect(todayEnd.toISOString()).toBe("2026-10-06T16:59:59.999Z");

    // Yesterday start: Bangkok 2026-10-05 00:00:00 is UTC 2026-10-04 17:00:00
    expect(yesterdayStart.toISOString()).toBe("2026-10-04T17:00:00.000Z");

    // Yesterday end: Bangkok 2026-10-05 23:59:59.999 is UTC 2026-10-05 16:59:59.999
    expect(yesterdayEnd.toISOString()).toBe("2026-10-05T16:59:59.999Z");

    // 30 days ago: 30 days before todayStart
    const expectedThirtyDays = new Date(todayStart.getTime() - 30 * 24 * 3600 * 1000);
    expect(thirtyDaysAgo.toISOString()).toBe(expectedThirtyDays.toISOString());
  });

  it("handles midnight boundary crossing accurately", () => {
    // 2026-10-06 17:00:00 UTC -> 2026-10-07 00:00:00 in Bangkok
    const midnightBkk = new Date("2026-10-06T17:00:00.000Z");
    const { todayStart, yesterdayEnd } = getBangkokDateBoundaries(midnightBkk);

    expect(todayStart.toISOString()).toBe("2026-10-06T17:00:00.000Z");
    expect(yesterdayEnd.toISOString()).toBe("2026-10-06T16:59:59.999Z");
  });

  it("formats trends correctly (+X, -X, and 0)", () => {
    expect(formatTrend(5)).toBe("+5");
    expect(formatTrend(1)).toBe("+1");
    expect(formatTrend(0)).toBe("0");
    expect(formatTrend(-1)).toBe("-1");
    expect(formatTrend(-4)).toBe("-4");
  });
});
