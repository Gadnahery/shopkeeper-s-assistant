import { format } from "date-fns";

/**
 * Formats any server/DB timestamp into the user's local "yyyy-MM-dd" date string.
 * This guarantees consistent day grouping matching what the user sees on their screen.
 */
export function toLocalDayString(dateVal?: string | Date | null): string {
  if (!dateVal) return "";
  if (typeof dateVal === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dateVal.trim())) {
    return dateVal.trim();
  }
  try {
    const d = typeof dateVal === "string" ? new Date(dateVal) : dateVal;
    if (Number.isNaN(d.getTime())) return "";
    return format(d, "yyyy-MM-dd");
  } catch {
    return "";
  }
}

/**
 * Converts a date string ("YYYY-MM-DD") or Date to the start of that day in the user's local timezone,
 * formatted as a full ISO 8601 UTC string suitable for Supabase queries.
 * 
 * Example: for "2026-09-11" in UTC+3 (Tanzania / East Africa):
 * returns "2026-09-10T21:00:00.000Z"
 */
export function getLocalDayStartIso(dateVal?: string | Date | null): string {
  if (!dateVal) return new Date(0).toISOString();
  
  let dateStr: string;
  if (typeof dateVal === "string") {
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateVal.trim())) {
      dateStr = dateVal.trim();
    } else {
      dateStr = toLocalDayString(dateVal);
    }
  } else {
    dateStr = format(dateVal, "yyyy-MM-dd");
  }

  const parts = dateStr.split("-").map(Number);
  if (parts.length < 3 || Number.isNaN(parts[0]) || Number.isNaN(parts[1]) || Number.isNaN(parts[2])) {
    return `${dateStr}T00:00:00.000Z`;
  }
  const [year, month, day] = parts;
  const localDate = new Date(year, month - 1, day, 0, 0, 0, 0);
  return localDate.toISOString();
}

/**
 * Converts a date string ("YYYY-MM-DD") or Date to the end of that day in the user's local timezone,
 * formatted as a full ISO 8601 UTC string suitable for Supabase queries.
 * 
 * Example: for "2026-09-11" in UTC+3 (Tanzania / East Africa):
 * returns "2026-09-11T20:59:59.999Z"
 */
export function getLocalDayEndIso(dateVal?: string | Date | null): string {
  if (!dateVal) return new Date().toISOString();

  let dateStr: string;
  if (typeof dateVal === "string") {
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateVal.trim())) {
      dateStr = dateVal.trim();
    } else {
      dateStr = toLocalDayString(dateVal);
    }
  } else {
    dateStr = format(dateVal, "yyyy-MM-dd");
  }

  const parts = dateStr.split("-").map(Number);
  if (parts.length < 3 || Number.isNaN(parts[0]) || Number.isNaN(parts[1]) || Number.isNaN(parts[2])) {
    return `${dateStr}T23:59:59.999Z`;
  }
  const [year, month, day] = parts;
  const localDate = new Date(year, month - 1, day, 23, 59, 59, 999);
  return localDate.toISOString();
}

/**
 * Checks if a timestamp falls within a start and end local day range (inclusive).
 */
export function isTimestampInLocalDayRange(
  timestamp?: string | Date | null,
  startDayStr?: string | null,
  endDayStr?: string | null
): boolean {
  if (!timestamp) return false;
  const localDay = toLocalDayString(timestamp);
  if (!localDay) return false;
  if (startDayStr && localDay < startDayStr) return false;
  if (endDayStr && localDay > endDayStr) return false;
  return true;
}
