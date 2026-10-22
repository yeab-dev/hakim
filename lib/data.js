import "server-only";
import areas from "@/data/areas.json";
import clinics from "@/data/clinics.json";
import doctors from "@/data/doctors.json";
import specialties from "@/data/specialties.json";
import { relativeDayLabel, addisToday } from "./clock";
import { resolveSlot, weekFor } from "./slots";
import { takenSlotIds } from "./store";

// Every read the pages make. On Vite this was a mock API served by the dev
// server and a useFetch in each screen; here the pages are server components
// and call these functions directly — no endpoint in between.
//
// `import "server-only"` makes a build fail if a client component ever
// imports this file, rather than quietly shipping the data layer to phones.

const specialtiesById = new Map(specialties.map((s) => [s.id, s]));
const areasById = new Map(areas.map((a) => [a.id, a]));
const clinicsById = new Map(clinics.map((c) => [c.id, c]));
const doctorsById = new Map(doctors.map((d) => [d.id, d]));

// The Vite mock's deliberate delay, kept for the one screen with a
// loading.js, so the loading state can actually be seen.
const LIST_DELAY_MS = 700;
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function specialtiesOf(clinicId) {
  const ids = new Set(doctors.filter((d) => d.clinicId === clinicId).map((d) => d.specialty));
  return specialties.filter((s) => ids.has(s.id));
}

function withNames(clinic) {
  return { ...clinic, areaName: areasById.get(clinic.area).name, specialties: specialtiesOf(clinic.id) };
}

export function getSpecialties() {
  return specialties;
}

export function getAreas() {
  return areas;
}

export function isSpecialty(id) {
  return specialtiesById.has(id);
}

export function isArea(id) {
  return areasById.has(id);
}

export function getClinicIds() {
  return clinics.map((c) => c.id);
}

// The clinics page: filtered, each with its soonest open slot. Unknown filter
// values are ignored rather than matching nothing (the page says so).
// `fail` is the old mock's ?fail=1 switch — the read throws, error.js shows.
export async function listClinics({ specialty, area, fail = false } = {}) {
  await wait(LIST_DELAY_MS);
  if (fail) throw new Error("The clinic directory is not answering.");

  const taken = await takenSlotIds();
  const now = new Date();
  const today = addisToday(now);

  return clinics
    .filter((c) => !area || c.area === area)
    .map(withNames)
    .filter((c) => !specialty || c.specialties.some((s) => s.id === specialty))
    .map((clinic) => {
      const own = doctors.filter(
        (d) => d.clinicId === clinic.id && (!specialty || d.specialty === specialty),
      );
      let soonest = null;
      for (const doctor of own) {
        for (const day of weekFor(doctor, taken, now)) {
          const first = day.slots[0];
          if (first && (!soonest || first.startsAt < soonest.startsAt)) {
            soonest = { ...first, doctorName: doctor.name, label: `${relativeDayLabel(day.date, today)}, ${first.time}` };
          }
        }
      }
      return { ...clinic, soonest };
    });
}

// One clinic, its doctors, and each doctor's open slots for the week.
export async function getClinic(id) {
  const clinic = clinicsById.get(id);
  if (!clinic) return null;
  const taken = await takenSlotIds();
  const now = new Date();
  return {
    ...withNames(clinic),
    doctors: doctors
      .filter((d) => d.clinicId === id)
      .map((d) => ({
        ...d,
        specialtyName: specialtiesById.get(d.specialty).name,
        week: weekFor(d, taken, now),
      })),
  };
}

// One slot by id, with its doctor and clinic, and whether it is free.
// null when the id is not a real, future slot this week.
export async function getSlot(id) {
  const doctorId = typeof id === "string" ? id.split("--")[0] : "";
  const doctor = doctorsById.get(doctorId);
  const slot = resolveSlot(id, doctor);
  if (!slot) return null;
  const taken = await takenSlotIds();
  return {
    ...slot,
    doctor: { id: doctor.id, name: doctor.name, fee: doctor.fee, specialtyName: specialtiesById.get(doctor.specialty).name },
    clinic: withNames(clinicsById.get(doctor.clinicId)),
    taken: taken.has(slot.id),
  };
}

export function getDoctor(id) {
  return doctorsById.get(id) ?? null;
}

export function getClinicSummary(id) {
  const clinic = clinicsById.get(id);
  return clinic ? withNames(clinic) : null;
}
