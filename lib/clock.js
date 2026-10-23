// Dates and times in Addis Ababa, without a date library.
//
// Addis is UTC+3 all year (no daylight saving), so a slot is stored as a
// calendar date ("2026-10-24") plus a wall-clock time ("09:30") and turned into
// an instant with a fixed +03:00 offset. That keeps the app correct whatever
// time zone the server happens to run in.
//
// This file is arithmetic only: which day it is, adding days, minutes since
// midnight. Everything a person reads (dates, times, money) is formatted in
// lib/format.js, with Intl. Until Day 47 the labels were made by hand here.

import { TIME_ZONE } from "./format";

const OFFSET = "+03:00";

const DATE_IN_ADDIS = new Intl.DateTimeFormat("en-CA", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

// Today's date in Addis, as "YYYY-MM-DD". (en-CA formats dates that way.)
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

// 0 = Sunday … 6 = Saturday, for that calendar date.
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

// "08:30" → minutes since midnight, and back.
export function toMinutes(time) {
  const [h, min] = time.split(":").map(Number);
  return h * 60 + min;
}

export function fromMinutes(total) {
  const h = String(Math.floor(total / 60)).padStart(2, "0");
  const min = String(total % 60).padStart(2, "0");
  return `${h}:${min}`;
}
