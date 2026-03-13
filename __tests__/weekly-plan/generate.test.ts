import { describe, it, expect, vi } from "vitest";

// Mock all transitive dependencies that require env vars / network
vi.mock("@neondatabase/serverless", () => ({
  neon: () => () => Promise.resolve([]),
}));
vi.mock("@/lib/db", () => ({ db: {} }));
vi.mock("@/lib/db/schema", () => ({}));
vi.mock("@/lib/ai/client", () => ({
  chatCompletion: vi.fn().mockResolvedValue("{}"),
}));
vi.mock("@/lib/ai/resolvePrompt", () => ({
  resolvePrompt: vi.fn().mockResolvedValue(""),
}));
vi.mock("@/lib/ai/prompts", () => ({
  PROMPT_WEEKLY_PLAN: "test",
  PROMPT_DAILY_TASK_CURATOR: "test",
}));
vi.mock("@/lib/db/encryption-helpers", () => ({
  encryptFields: (obj: Record<string, unknown>) => obj,
  WEEKLY_PLAN_ENCRYPTED_FIELDS: [],
  DAILY_THEME_ENCRYPTED_FIELDS: [],
}));

import { getUpcomingWeekRange } from "@/lib/weekly-plan/generate";

/**
 * Helper to get the local date string (YYYY-MM-DD) from a Date,
 * matching the behavior of the function which uses setHours() in local time.
 */
function toLocalDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

describe("getUpcomingWeekRange", () => {
  it("returns next Monday-Sunday when called on a Wednesday", () => {
    const wed = new Date("2026-03-11T10:00:00Z"); // Wednesday
    const range = getUpcomingWeekRange(wed);
    expect(toLocalDateStr(range.start)).toBe("2026-03-16"); // Next Monday
    expect(toLocalDateStr(range.end)).toBe("2026-03-22"); // Next Sunday
  });

  it("returns current week when called on Monday", () => {
    const mon = new Date("2026-03-16T10:00:00Z"); // Monday
    const range = getUpcomingWeekRange(mon);
    expect(toLocalDateStr(range.start)).toBe("2026-03-16");
    expect(toLocalDateStr(range.end)).toBe("2026-03-22");
  });

  it("returns next Monday-Sunday when called on Sunday", () => {
    const sun = new Date("2026-03-15T10:00:00Z"); // Sunday
    const range = getUpcomingWeekRange(sun);
    expect(toLocalDateStr(range.start)).toBe("2026-03-16"); // Next Monday
    expect(toLocalDateStr(range.end)).toBe("2026-03-22");
  });

  it("returns next Monday-Sunday when called on Friday", () => {
    const fri = new Date("2026-03-13T10:00:00Z"); // Friday
    const range = getUpcomingWeekRange(fri);
    expect(toLocalDateStr(range.start)).toBe("2026-03-16"); // Next Monday
    expect(toLocalDateStr(range.end)).toBe("2026-03-22");
  });

  it("returns next Monday-Sunday when called on Saturday", () => {
    const sat = new Date("2026-03-14T10:00:00Z"); // Saturday
    const range = getUpcomingWeekRange(sat);
    expect(toLocalDateStr(range.start)).toBe("2026-03-16"); // Next Monday
    expect(toLocalDateStr(range.end)).toBe("2026-03-22");
  });

  it("end date has time set to 23:59:59.999 in local time", () => {
    const mon = new Date("2026-03-16T10:00:00Z");
    const range = getUpcomingWeekRange(mon);
    expect(range.end.getHours()).toBe(23);
    expect(range.end.getMinutes()).toBe(59);
    expect(range.end.getSeconds()).toBe(59);
    expect(range.end.getMilliseconds()).toBe(999);
  });

  it("start date has time set to 00:00:00.000 in local time", () => {
    const wed = new Date("2026-03-11T15:30:00Z");
    const range = getUpcomingWeekRange(wed);
    expect(range.start.getHours()).toBe(0);
    expect(range.start.getMinutes()).toBe(0);
    expect(range.start.getSeconds()).toBe(0);
    expect(range.start.getMilliseconds()).toBe(0);
  });

  it("returns a 7-day span (Monday through Sunday)", () => {
    const tue = new Date("2026-03-10T10:00:00Z"); // Tuesday
    const range = getUpcomingWeekRange(tue);
    const diffMs = range.end.getTime() - range.start.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    // Should be ~6.999... days (Mon 00:00 to Sun 23:59:59.999)
    expect(diffDays).toBeGreaterThan(6.9);
    expect(diffDays).toBeLessThan(7.1);
  });

  it("start always falls on a Monday (day 1)", () => {
    const dates = [
      new Date("2026-03-10T10:00:00Z"), // Tue
      new Date("2026-03-11T10:00:00Z"), // Wed
      new Date("2026-03-12T10:00:00Z"), // Thu
      new Date("2026-03-13T10:00:00Z"), // Fri
      new Date("2026-03-14T10:00:00Z"), // Sat
      new Date("2026-03-15T10:00:00Z"), // Sun
      new Date("2026-03-16T10:00:00Z"), // Mon
    ];
    for (const d of dates) {
      const range = getUpcomingWeekRange(d);
      expect(range.start.getDay()).toBe(1); // Monday
    }
  });

  it("end always falls on a Sunday (day 0)", () => {
    const dates = [
      new Date("2026-03-10T10:00:00Z"),
      new Date("2026-03-11T10:00:00Z"),
      new Date("2026-03-16T10:00:00Z"),
    ];
    for (const d of dates) {
      const range = getUpcomingWeekRange(d);
      expect(range.end.getDay()).toBe(0); // Sunday
    }
  });
});
