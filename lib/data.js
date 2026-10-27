import "server-only";
import { cache } from "react";
import areas from "@/data/areas.json";
import clinics from "@/data/clinics.json";
import doctors from "@/data/doctors.json";
import specialties from "@/data/specialties.json";
import { addisToday } from "./clock";
import { relativeDay } from "./format";
import { resolveSlot, weekFor } from "./slots";
import { takenSlotIds } from "./store";

const specialtiesById = new Map(specialties.map((s) => [s.id, s]));
const areasById = new Map(areas.map((a) => [a.id, a]));
const clinicsById = new Map(clinics.map((c) => [c.id, c]));
const doctorsById = new Map(doctors.map((d) => [d.id, d]));

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

export async function listClinics({ specialty, area, fail = false, slow = false } = {}) {
  if (slow) await wait(LIST_DELAY_MS);
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
            soonest = { ...first, doctorName: doctor.name, label: `${relativeDay(day.date, today)}, ${first.time}` };
          }
        }
      }
      return { ...clinic, soonest };
    });
}

export const getClinic = cache(async function getClinic(id) {
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
});

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

const fold = (s) => s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
export const SEARCH_MIN = 2;
const SEARCH_LIMIT = 6;

export function searchDirectory(query) {
  const words = fold(String(query ?? "")).replace(/\bdr\.?\s*/g, "").split(/\s+/).filter(Boolean);
  if (words.join("").length < SEARCH_MIN) return { clinics: [], doctors: [] };
  const matches = (...fields) => {
    const hay = fold(fields.join(" "));
    return words.every((w) => hay.includes(w));
  };

  const clinicHits = clinics
    .map(withNames)
    .filter((c) => matches(c.name, c.areaName, ...c.specialties.map((s) => s.name)))
    .slice(0, SEARCH_LIMIT)
    .map((c) => ({ id: c.id, name: c.name, areaName: c.areaName }));

  const doctorHits = doctors
    .filter((d) => {
      const clinic = clinicsById.get(d.clinicId);
      return matches(d.name, specialtiesById.get(d.specialty).name, clinic.name, areasById.get(clinic.area).name);
    })
    .slice(0, SEARCH_LIMIT)
    .map((d) => {
      const clinic = clinicsById.get(d.clinicId);
      return {
        id: d.id,
        name: d.name,
        specialtyName: specialtiesById.get(d.specialty).name,
        clinicId: clinic.id,
        clinicName: clinic.name,
      };
    });

  return { clinics: clinicHits, doctors: doctorHits };
}

export function getClinicCard(id) {
  const clinic = clinicsById.get(id);
  if (!clinic) return null;
  const own = doctors.filter((d) => d.clinicId === id);
  const fees = own.map((d) => d.fee);
  return {
    ...withNames(clinic),
    doctorCount: own.length,
    feeFrom: Math.min(...fees),
    feeTo: Math.max(...fees),
  };
}
