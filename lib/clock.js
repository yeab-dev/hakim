import { TIME_ZONE } from "./format";

const OFFSET = "+03:00";

const DATE_IN_ADDIS = new Intl.DateTimeFormat("en-CA", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function addisToday(now = new Date()) {
  return DATE_IN_ADDIS.format(now);
}

function parts(date) {
  const [y, m, d] = date.split("-").map(Number);
  return { y, m, d };
}

export function addDays(date, days) {
  const { y, m, d } = parts(date);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

export function weekday(date) {
  const { y, m, d } = parts(date);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

export function toInstant(date, time) {
  return `${date}T${time}:00${OFFSET}`;
}

export function isPast(instant, now = new Date()) {
  return new Date(instant).getTime() <= now.getTime();
}

export function toMinutes(time) {
  const [h, min] = time.split(":").map(Number);
  return h * 60 + min;
}

export function fromMinutes(total) {
  const h = String(Math.floor(total / 60)).padStart(2, "0");
  const min = String(total % 60).padStart(2, "0");
  return `${h}:${min}`;
}
