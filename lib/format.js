// Every price, date and time Hakim shows goes through this file (Day 47).
//
// Each Intl formatter is built once, here, and reused: building one is the
// expensive part, calling it is not. Every one names its locale and its time
// zone. Leaving either to the environment is how a server in Frankfurt and a
// phone in Addis end up printing different times (and React reports a
// hydration mismatch).
//
// - Locale "en-GB": ICU (Node 24, ICU 78) has no English data of its own for
//   Ethiopia, so "en-ET" falls back to US English ("Oct 24, 2026, 9:30 AM").
//   en-GB gives the day-first, 24-hour form Hakim has always shown
//   ("Sat 24 Oct", "09:30"), and the same "ETB 450" for money.
// - Time zone Africa/Addis_Ababa: EAT, UTC+3 all year, no daylight saving.
// - The Ethiopian calendar and the 12-hour day counted from dawn are not used,
//   deliberately: Intl cannot produce them, and doctors' schedules and the
//   clinics' own signs use the international clock. See FUTURE.md.
//
// These run on the server. Pages pass the finished strings to client
// components as props, so the browser's own ICU data never gets a vote.

export const LOCALE = "en-GB";
export const TIME_ZONE = "Africa/Addis_Ababa";

// Money is stored as whole birr (an integer), never as a float.
const ETB = new Intl.NumberFormat(LOCALE, { style: "currency", currency: "ETB", maximumFractionDigits: 0 });

// "ETB 450"
export const etb = (birr) => ETB.format(birr);

// "ETB 450–600", or "ETB 450" when both ends agree (formatRange would print
// "~ETB 450").
export const etbRange = (low, high) => (low === high ? ETB.format(low) : ETB.formatRange(low, high));

const WHEN = new Intl.DateTimeFormat(LOCALE, { dateStyle: "medium", timeStyle: "short", timeZone: TIME_ZONE });
const DAY = new Intl.DateTimeFormat(LOCALE, { weekday: "short", day: "numeric", month: "short", timeZone: TIME_ZONE });
const LONG_DAY = new Intl.DateTimeFormat(LOCALE, {
  weekday: "long",
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: TIME_ZONE,
});
const TIME = new Intl.DateTimeFormat(LOCALE, { hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: TIME_ZONE });
const RELATIVE = new Intl.RelativeTimeFormat(LOCALE, { numeric: "auto" });

// A calendar date ("2026-10-24") has no time of its own: noon in Addis is
// the same date in every time zone the formatter might be asked about.
const asInstant = (value) => (/^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T12:00:00+03:00`) : new Date(value));

// "24 Oct 2026, 09:30" — an instant (ISO string or Date).
export const when = (instant) => WHEN.format(asInstant(instant));

// "Sat 24 Oct" — a date or an instant.
export const day = (value) => DAY.format(asInstant(value));

// "Saturday, 24 Oct 2026"
export const longDay = (value) => LONG_DAY.format(asInstant(value));

// "09:30"
export const time = (instant) => TIME.format(asInstant(instant));

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY_MS = 24 * HOUR;

// "in 25 minutes", "3 hours ago", "tomorrow", "in 4 days".
export function relative(instant, now = new Date()) {
  const diff = asInstant(instant).getTime() - now.getTime();
  const size = Math.abs(diff);
  if (size < HOUR) return RELATIVE.format(Math.round(diff / MINUTE), "minute");
  if (size < DAY_MS) return RELATIVE.format(Math.round(diff / HOUR), "hour");
  return RELATIVE.format(Math.round(diff / DAY_MS), "day");
}

// "Today", "Tomorrow", "Yesterday", or "Sat 24 Oct" — for calendar dates, so
// it counts days on the calendar, not 24-hour periods.
export function relativeDay(date, today) {
  const days = Math.round((asInstant(date) - asInstant(today)) / DAY_MS);
  if (Math.abs(days) <= 1) {
    const word = RELATIVE.format(days, "day");
    return word.charAt(0).toUpperCase() + word.slice(1);
  }
  return day(date);
}
