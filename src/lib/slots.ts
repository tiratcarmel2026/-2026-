import type { Department } from "./types";

const TIME_ZONE = "Asia/Jerusalem";
const WEEKDAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const MAX_ADVANCE_DAYS = 30;
export const MIN_LEAD_MINUTES = 30; // can't book a slot starting sooner than this
export const HOLD_DURATION_MINUTES = 15;

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

interface IsraelDateParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  weekday: number; // 0 = Sunday .. 6 = Saturday
}

export function getIsraelParts(date: Date = new Date()): IsraelDateParts {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    weekday: "short",
    hour12: false,
  });

  const map: Record<string, string> = {};
  for (const part of formatter.formatToParts(date)) {
    map[part.type] = part.value;
  }

  let hour = parseInt(map.hour, 10);
  if (hour === 24) hour = 0; // some environments render midnight as "24"

  return {
    year: parseInt(map.year, 10),
    month: parseInt(map.month, 10),
    day: parseInt(map.day, 10),
    hour,
    minute: parseInt(map.minute, 10),
    weekday: WEEKDAY_NAMES.indexOf(map.weekday),
  };
}

export function todayIsraelDateString(): string {
  const p = getIsraelParts();
  return `${p.year}-${pad(p.month)}-${pad(p.day)}`;
}

export function addDaysToDateString(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  return `${dt.getUTCFullYear()}-${pad(dt.getUTCMonth() + 1)}-${pad(dt.getUTCDate())}`;
}

export function weekdayOfDateString(dateStr: string): number {
  const [y, m, d] = dateStr.split("-").map(Number);
  // Noon UTC avoids any DST/offset edge cases affecting the calendar day.
  const dt = new Date(Date.UTC(y, m - 1, d, 12));
  return dt.getUTCDay();
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function isValidDateString(dateStr: string): boolean {
  if (!DATE_RE.test(dateStr)) return false;
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return (
    dt.getUTCFullYear() === y &&
    dt.getUTCMonth() === m - 1 &&
    dt.getUTCDate() === d
  );
}

export function isDateWithinBookableWindow(dateStr: string): boolean {
  if (!isValidDateString(dateStr)) return false;
  const today = todayIsraelDateString();
  if (dateStr < today) return false;
  const max = addDaysToDateString(today, MAX_ADVANCE_DAYS);
  if (dateStr > max) return false;
  return true;
}

export function isWorkingDay(department: Department, dateStr: string): boolean {
  return department.work_days.includes(weekdayOfDateString(dateStr));
}

/** All slot start times ("HH:MM") for a department on a given date, already
 * filtered by the bookable window, working days, and (for today) a minimum
 * lead time. Does not know about existing bookings - see /api/slots. */
export function getSlotTimesForDate(
  department: Department,
  dateStr: string
): string[] {
  if (!isDateWithinBookableWindow(dateStr)) return [];
  if (!isWorkingDay(department, dateStr)) return [];

  const [startH, startM] = department.work_start_time.split(":").map(Number);
  const [endH, endM] = department.work_end_time.split(":").map(Number);
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;
  const step = department.slot_duration_minutes;

  const times: string[] = [];
  for (let t = startMinutes; t + step <= endMinutes; t += step) {
    times.push(`${pad(Math.floor(t / 60))}:${pad(t % 60)}`);
  }

  const today = todayIsraelDateString();
  if (dateStr === today) {
    const now = getIsraelParts();
    const earliestMinutes = now.hour * 60 + now.minute + MIN_LEAD_MINUTES;
    return times.filter((t) => {
      const [h, m] = t.split(":").map(Number);
      return h * 60 + m >= earliestMinutes;
    });
  }

  return times;
}

export function isValidTimeString(time: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(time);
}
