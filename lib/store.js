import "server-only";
import { randomInt } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import seed from "@/data/appointments.json";
import doctors from "@/data/doctors.json";
import { addDays, addisToday, toInstant } from "./clock";
import { slotId, timesOn } from "./slots";

// The write store: every booking, in one JSON file.
//
// LIMITATION, on purpose until the database arrives: the file lives in
// .data/appointments.json on the machine running `next start`. That is fine
// for one server on one disk. It is wrong for a serverless host (read-only or
// throw-away disks), for more than one server, and for anything real — there
// are no transactions, only a lock inside this one Node process.
//
// Until the first booking or cancellation is written, the file does not exist
// and the seed in data/appointments.json is used, laid out relative to *today*
// ("in two days, at 09:00") so the demo always has upcoming and past bookings.
// Delete .data/ to go back to the seed.

const FILE = path.join(process.cwd(), ".data", "appointments.json");

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
  };
}

async function load() {
  try {
    return JSON.parse(await readFile(FILE, "utf8"));
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    const today = addisToday();
    return seed.map((entry) => placeSeed(entry, today));
  }
}

async function save(appointments) {
  await mkdir(path.dirname(FILE), { recursive: true });
  const tmp = `${FILE}.${process.pid}.tmp`;
  await writeFile(tmp, `${JSON.stringify(appointments, null, 2)}\n`);
  await rename(tmp, FILE); // atomic: a reader never sees half a file
}

// One write at a time. Next.js may load this module more than once (pages,
// actions and route handlers are bundled separately), so the queue hangs off
// globalThis rather than a module variable.
function exclusive(fn) {
  const run = (globalThis.__hakimStoreQueue ?? Promise.resolve()).then(fn);
  globalThis.__hakimStoreQueue = run.catch(() => {});
  return run;
}

const ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"; // no 0/O, 1/I
function newReference(existing) {
  for (;;) {
    let id = "HK-";
    for (let i = 0; i < 5; i += 1) id += ALPHABET[randomInt(ALPHABET.length)];
    if (!existing.has(id)) return id;
  }
}

export async function getAppointment(id) {
  return (await load()).find((a) => a.id === id) ?? null;
}

export async function listAppointmentsFor(userPhone) {
  return (await load()).filter((a) => a.userPhone === userPhone);
}

// Slot ids held by a live booking.
export async function takenSlotIds() {
  return new Set((await load()).filter((a) => a.status === "booked").map((a) => a.slotId));
}

// Books the slot unless somebody got there first. The "is it free?" check and
// the write happen inside the same exclusive step, so two people pressing
// Book at once cannot both get it.
export function createAppointment(input) {
  return exclusive(async () => {
    const all = await load();
    if (all.some((a) => a.slotId === input.slotId && a.status === "booked")) {
      return { ok: false, reason: "taken" };
    }
    const appointment = {
      id: newReference(new Set(all.map((a) => a.id))),
      ...input,
      status: "booked",
      createdAt: new Date().toISOString(),
      cancelledAt: null,
    };
    await save([...all, appointment]);
    return { ok: true, appointment };
  });
}

// No permission check here: the store does what it is told. Who may cancel
// what is decided by the caller (the server action and the route handler),
// which know who is asking.
export function markCancelled(id) {
  return exclusive(async () => {
    const all = await load();
    const target = all.find((a) => a.id === id);
    if (!target) return null;
    if (target.status !== "cancelled") {
      target.status = "cancelled";
      target.cancelledAt = new Date().toISOString();
      await save(all);
    }
    return target;
  });
}
