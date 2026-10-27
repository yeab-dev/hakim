export const LOCALE = "en-GB";
export const TIME_ZONE = "Africa/Addis_Ababa";

const ETB = new Intl.NumberFormat(LOCALE, { style: "currency", currency: "ETB", maximumFractionDigits: 0 });

export const etb = (birr) => ETB.format(birr);

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

const asInstant = (value) => (/^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T12:00:00+03:00`) : new Date(value));

export const when = (instant) => WHEN.format(asInstant(instant));

export const day = (value) => DAY.format(asInstant(value));

export const longDay = (value) => LONG_DAY.format(asInstant(value));

export const time = (instant) => TIME.format(asInstant(instant));

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY_MS = 24 * HOUR;

export function relative(instant, now = new Date()) {
  const diff = asInstant(instant).getTime() - now.getTime();
  const size = Math.abs(diff);
  if (size < HOUR) return RELATIVE.format(Math.round(diff / MINUTE), "minute");
  if (size < DAY_MS) return RELATIVE.format(Math.round(diff / HOUR), "hour");
  return RELATIVE.format(Math.round(diff / DAY_MS), "day");
}

export function relativeDay(date, today) {
  const days = Math.round((asInstant(date) - asInstant(today)) / DAY_MS);
  if (Math.abs(days) <= 1) {
    const word = RELATIVE.format(days, "day");
    return word.charAt(0).toUpperCase() + word.slice(1);
  }
  return day(date);
}
