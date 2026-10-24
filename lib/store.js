import "server-only";
import { randomInt } from "node:crypto";
import seed from "@/data/appointments.json";
import doctors from "@/data/doctors.json";
import { addDays, addisToday, toInstant } from "./clock";
import { exclusive, readCollection, writeCollection } from "./files";
import { slotId, timesOn } from "./slots";

// The appointment store: every booking, in .data/appointments.json (see
// lib/files.js for why a file, and its limits).
//
// Each booking belongs to an account by `userId` — the id from the session,
// never a phone number or an id sent by the browser. The booking's `phone` is
// only the number the clinic should call, and may be a relative's.
//
// Until the first booking, cancellation or check-in is written, the file does
// not exist and the seed in data/appointments.json is used, laid out relative
// to *today* ("in two days, at 09:00"), so the demo always has today's queue,
// upcoming and past bookings. Delete .data/ to go back to the seed.

const COLLECTION = "appointments";
const doctorsById = new Map(doctors.map((d) => [d.id, d]));

// A seed booking says "dayOffset: 2, time: 09:00". Upcoming ones move forward
// to the doctor's next working day, so the slot really exists on the grid.
function placeSeed(entry, today) {
  const doctor = doctorsById.get(entry.doctorId);
  let date = addDays(today, entry.dayOffset);
  if (entry.dayOffset > 0) {
    for (let i = 0; i < 7 && timesOn(doctor, date).length === 0; i += 1) date = addDays(date, 1);
    const times = timesOn(doctor, date);
    if (!times.includes(entry.time)) entry = { ...entry, time: times[0] };
  } else if (entry.dayOffset < 0) {
    // Past ones move back to a day the doctor worked.
    for (let i = 0; i < 7 && timesOn(doctor, date).length === 0; i += 1) date = addDays(date, -1);
  }
  const { dayOffset: _unused, ...rest } = entry;
  return {
    ...rest,
    clinicId: doctor.clinicId,
    slotId: slotId(doctor.id, date, entry.time),
    date,
    startsAt: toInstant(date, entry.time),
    createdAt: toInstant(addDays(date, -7), "10:00"),
    cancelledAt: entry.status === "cancelled" ? toInstant(addDays(date, -1), "18:00") : null,
    arrivedAt: entry.status === "arrived" ? toInstant(date, entry.time) : null,
  };
}

function load() {
  return readCollection(COLLECTION, () => {
    const today = addisToday();
    return seed.map((entry) => placeSeed(entry, today));
  });
}

const ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"; // no 0/O, 1/I
function newReference(existing) {
  for (;;) {
    let id = "HK-";
    for (let i = 0; i < 5; i += 1) id += ALPHABET[randomInt(ALPHABET.length)];
    if (!existing.has(id)) return id;
  }
}

// By id, with no owner check — callers decide who may see it (lib/appointments.js).
export async function getAppointment(id) {
  if (typeof id !== "string") return null;
  return (await load()).find((a) => a.id === id) ?? null;
}

// Scoped reads. The scope is always an argument the caller took from the
// session: an account's own bookings, or one clinic's bookings for one day.
export async function listAppointmentsFor(userId) {
  return (await load()).filter((a) => a.userId === userId);
}

export async function listClinicDay(clinicId, date) {
  return (await load()).filter((a) => a.clinicId === clinicId && a.date === date);
}

// One clinic's bookings from one date to another, inclusive ("YYYY-MM-DD").
export async function listClinicRange(clinicId, from, to) {
  return (await load()).filter((a) => a.clinicId === clinicId && a.date >= from && a.date <= to);
}

// How many live bookings with the same doctor, the same day, start before this
// one and have not checked in yet — a count, never who they are.
export async function countAhead(appointment) {
  return (await load()).filter(
    (a) =>
      a.doctorId === appointment.doctorId &&
      a.date === appointment.date &&
      a.status === "booked" &&
      a.startsAt < appointment.startsAt,
  ).length;
}

// Slot ids held by a live booking (booked or already checked in).
export async function takenSlotIds() {
  return new Set((await load()).filter((a) => a.status !== "cancelled").map((a) => a.slotId));
}

// Books the slot unless somebody got there first. The "is it free?" check and
// the write happen inside the same exclusive step, so two people pressing
// Book at once cannot both get it.
export function createAppointment(input) {
  return exclusive(async () => {
    const all = await load();
    if (all.some((a) => a.slotId === input.slotId && a.status !== "cancelled")) {
      return { ok: false, reason: "taken" };
    }
    const appointment = {
      id: newReference(new Set(all.map((a) => a.id))),
      ...input,
      status: "booked",
      createdAt: new Date().toISOString(),
      cancelledAt: null,
      arrivedAt: null,
    };
    await writeCollection(COLLECTION, [...all, appointment]);
    return { ok: true, appointment };
  });
}

// No permission checks below: the store does what it is told. Who may change
// what is decided by the callers (server actions and route handlers), which
// know who is asking.
function setStatus(id, status, stampField) {
  return exclusive(async () => {
    const all = await load();
    const target = all.find((a) => a.id === id);
    if (!target) return null;
    if (target.status !== status) {
      target.status = status;
      target[stampField] = new Date().toISOString();
      await writeCollection(COLLECTION, all);
    }
    return target;
  });
}

export const markCancelled = (id) => setStatus(id, "cancelled", "cancelledAt");
export const markArrived = (id) => setStatus(id, "arrived", "arrivedAt");
