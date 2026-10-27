import "server-only";
import { randomInt } from "node:crypto";
import seed from "@/data/appointments.json";
import doctors from "@/data/doctors.json";
import { addDays, addisToday, toInstant } from "./clock";
import { exclusive, readCollection, writeCollection } from "./files";
import { slotId, timesOn } from "./slots";

const COLLECTION = "appointments";
const doctorsById = new Map(doctors.map((d) => [d.id, d]));

function placeSeed(entry, today) {
  const doctor = doctorsById.get(entry.doctorId);
  let date = addDays(today, entry.dayOffset);
  if (entry.dayOffset > 0) {
    for (let i = 0; i < 7 && timesOn(doctor, date).length === 0; i += 1) date = addDays(date, 1);
    const times = timesOn(doctor, date);
    if (!times.includes(entry.time)) entry = { ...entry, time: times[0] };
  } else if (entry.dayOffset < 0) {
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

const ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
function newReference(existing) {
  for (;;) {
    let id = "HK-";
    for (let i = 0; i < 5; i += 1) id += ALPHABET[randomInt(ALPHABET.length)];
    if (!existing.has(id)) return id;
  }
}

export async function getAppointment(id) {
  if (typeof id !== "string") return null;
  return (await load()).find((a) => a.id === id) ?? null;
}

export async function listAppointmentsFor(userId) {
  return (await load()).filter((a) => a.userId === userId);
}

export async function listClinicDay(clinicId, date) {
  return (await load()).filter((a) => a.clinicId === clinicId && a.date === date);
}

export async function countAhead(appointment) {
  return (await load()).filter(
    (a) =>
      a.doctorId === appointment.doctorId &&
      a.date === appointment.date &&
      a.status === "booked" &&
      a.startsAt < appointment.startsAt,
  ).length;
}

export async function takenSlotIds() {
  return new Set((await load()).filter((a) => a.status !== "cancelled").map((a) => a.slotId));
}

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
