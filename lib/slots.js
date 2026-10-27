import { addDays, addisToday, fromMinutes, isPast, toInstant, toMinutes, weekday } from "./clock";
import { relativeDay, time as timeLabel } from "./format";

export const DAYS_AHEAD = 7;

const SLOT_ID = /^([a-z0-9-]+?)--(\d{4})(\d{2})(\d{2})-(\d{2})(\d{2})$/;

export function slotId(doctorId, date, time) {
  return `${doctorId}--${date.replaceAll("-", "")}-${time.replace(":", "")}`;
}

export function parseSlotId(id) {
  const match = typeof id === "string" ? SLOT_ID.exec(id) : null;
  if (!match) return null;
  const [, doctorId, y, m, d, hh, mm] = match;
  return { doctorId, date: `${y}-${m}-${d}`, time: `${hh}:${mm}` };
}

export function timesOn(doctor, date) {
  const { days, start, end, minutes } = doctor.schedule;
  if (!days.includes(weekday(date))) return [];
  const times = [];
  for (let t = toMinutes(start); t + minutes <= toMinutes(end); t += minutes) {
    times.push(fromMinutes(t));
  }
  return times;
}

export function weekFor(doctor, taken, now = new Date()) {
  const today = addisToday(now);
  const week = [];
  for (let i = 0; i < DAYS_AHEAD; i += 1) {
    const date = addDays(today, i);
    const slots = timesOn(doctor, date)
      .map((time) => ({ id: slotId(doctor.id, date, time), time: timeLabel(toInstant(date, time)), startsAt: toInstant(date, time) }))
      .filter((slot) => !isPast(slot.startsAt, now) && !taken.has(slot.id));
    week.push({ date, label: relativeDay(date, today), works: timesOn(doctor, date).length > 0, slots });
  }
  return week;
}

export function resolveSlot(id, doctor, now = new Date()) {
  const parsed = parseSlotId(id);
  if (!parsed || !doctor || parsed.doctorId !== doctor.id) return null;
  const today = addisToday(now);
  const last = addDays(today, DAYS_AHEAD - 1);
  if (parsed.date < today || parsed.date > last) return null;
  if (!timesOn(doctor, parsed.date).includes(parsed.time)) return null;
  const startsAt = toInstant(parsed.date, parsed.time);
  if (isPast(startsAt, now)) return null;
  return { id, doctorId: doctor.id, date: parsed.date, time: parsed.time, startsAt };
}
