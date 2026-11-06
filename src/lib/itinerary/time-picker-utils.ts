export type TimePeriod = "AM" | "PM";
export type TimeSegmentType = "hour" | "minute" | "period";

export interface Time12HourParts {
  hour: number; // 1 to 12
  minute: number; // 0 to 59
  period: TimePeriod;
}

/**
 * Parses a 24-hour time string ("HH:mm") into 12-hour components { hour: 1..12, minute: 0..59, period: 'AM' | 'PM' }.
 */
export function parse24HourTo12Hour(time24: string): Time12HourParts {
  if (!time24 || typeof time24 !== "string") {
    return { hour: 9, minute: 0, period: "AM" };
  }

  const parts = time24.trim().split(":");
  if (parts.length < 2) {
    return { hour: 9, minute: 0, period: "AM" };
  }

  let h24 = parseInt(parts[0], 10);
  let minute = parseInt(parts[1], 10);

  if (isNaN(h24) || h24 < 0 || h24 > 23) h24 = 9;
  if (isNaN(minute) || minute < 0 || minute > 59) minute = 0;

  const period: TimePeriod = h24 >= 12 ? "PM" : "AM";
  const hour12 = h24 % 12 === 0 ? 12 : h24 % 12;

  return {
    hour: hour12,
    minute,
    period,
  };
}

/**
 * Formats 12-hour components back into a 24-hour string ("HH:mm") for canonical database / state storage.
 */
export function format12HourTo24Hour(
  hour: number,
  minute: number,
  period: TimePeriod
): string {
  let h24 = hour;
  if (period === "AM") {
    h24 = hour === 12 ? 0 : hour;
  } else {
    h24 = hour === 12 ? 12 : hour + 12;
  }

  const hh = String(Math.max(0, Math.min(23, h24))).padStart(2, "0");
  const mm = String(Math.max(0, Math.min(59, minute))).padStart(2, "0");

  return `${hh}:${mm}`;
}

/**
 * Formats a 24-hour string directly to human-readable 12-hour display ("hh:mm AM/PM").
 */
export function format12HourDisplay(time24: string): string {
  const { hour, minute, period } = parse24HourTo12Hour(time24);
  const hh = String(hour).padStart(2, "0");
  const mm = String(minute).padStart(2, "0");
  return `${hh}:${mm} ${period}`;
}

/**
 * Increments or decrements a specific time segment with wrapping.
 */
export function adjustTimeSegment(
  current: Time12HourParts,
  segment: TimeSegmentType,
  delta: number
): Time12HourParts {
  const result: Time12HourParts = { ...current };

  if (segment === "hour") {
    // 1 to 12
    let newHour = current.hour + delta;
    while (newHour > 12) newHour -= 12;
    while (newHour < 1) newHour += 12;
    result.hour = newHour;
  } else if (segment === "minute") {
    // 0 to 59
    let newMinute = current.minute + delta;
    while (newMinute > 59) newMinute -= 60;
    while (newMinute < 0) newMinute += 60;
    result.minute = newMinute;
  } else if (segment === "period") {
    result.period = current.period === "AM" ? "PM" : "AM";
  }

  return result;
}

