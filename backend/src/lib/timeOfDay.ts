import { TimeOfDay } from "@prisma/client";

/** Local server time bucket — client can pass ?tz offset later if needed. */
export function getCurrentTimeOfDay(date = new Date()): TimeOfDay {
  const h = date.getHours();
  if (h >= 5 && h < 12) return TimeOfDay.morning;
  if (h >= 12 && h < 17) return TimeOfDay.afternoon;
  if (h >= 17 && h < 21) return TimeOfDay.evening;
  return TimeOfDay.night;
}
