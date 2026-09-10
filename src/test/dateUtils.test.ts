import { describe, it, expect } from "vitest";
import {
  getLocalDayStartIso,
  getLocalDayEndIso,
  toLocalDayString,
  isTimestampInLocalDayRange,
} from "@/lib/dateUtils";
import { format } from "date-fns";

describe("dateUtils timezone-aware boundaries", () => {
  it("formats local day string correctly", () => {
    expect(toLocalDayString("2026-09-11")).toBe("2026-09-11");
    expect(toLocalDayString(null)).toBe("");
    expect(toLocalDayString(undefined)).toBe("");
  });

  it("calculates local day start as local midnight", () => {
    const startIso = getLocalDayStartIso("2026-09-11");
    expect(startIso).toMatch(/Z$/);
    const parsed = new Date(startIso);
    expect(parsed.getFullYear()).toBe(2026);
    expect(parsed.getMonth()).toBe(8); // 0-indexed September
    expect(parsed.getDate()).toBe(11);
    expect(parsed.getHours()).toBe(0);
    expect(parsed.getMinutes()).toBe(0);
    expect(parsed.getSeconds()).toBe(0);
  });

  it("calculates local day end as 23:59:59.999 local time", () => {
    const endIso = getLocalDayEndIso("2026-09-11");
    expect(endIso).toMatch(/Z$/);
    const parsed = new Date(endIso);
    expect(parsed.getFullYear()).toBe(2026);
    expect(parsed.getMonth()).toBe(8); // 0-indexed September
    expect(parsed.getDate()).toBe(11);
    expect(parsed.getHours()).toBe(23);
    expect(parsed.getMinutes()).toBe(59);
    expect(parsed.getSeconds()).toBe(59);
  });

  it("accurately handles midnight / early morning sales (user reported case)", () => {
    // Simulate a sale recorded at 02:15 AM local time on 2026-09-11
    const localSaleDate = new Date(2026, 8, 11, 2, 15, 0, 0);
    const utcTimestamp = localSaleDate.toISOString(); // e.g. "2026-09-10T23:15:00.000Z" in UTC+3

    const todayStr = "2026-09-11";
    const startIso = getLocalDayStartIso(todayStr);
    const endIso = getLocalDayEndIso(todayStr);

    // 1. Supabase query comparison simulation
    expect(utcTimestamp >= startIso).toBe(true);
    expect(utcTimestamp <= endIso).toBe(true);

    // 2. Client-side day check
    expect(toLocalDayString(utcTimestamp)).toBe(todayStr);

    // 3. Local day range inclusion
    expect(isTimestampInLocalDayRange(utcTimestamp, todayStr, todayStr)).toBe(true);

    // 4. Must NOT be considered yesterday
    expect(isTimestampInLocalDayRange(utcTimestamp, "2026-09-10", "2026-09-10")).toBe(false);

    // 5. Must also fall in weekly view
    expect(isTimestampInLocalDayRange(utcTimestamp, "2026-09-07", todayStr)).toBe(true);
  });

  it("handles empty or null gracefully", () => {
    expect(isTimestampInLocalDayRange(null, "2026-09-11", "2026-09-11")).toBe(false);
    expect(isTimestampInLocalDayRange("", "2026-09-11", "2026-09-11")).toBe(false);
  });
});
