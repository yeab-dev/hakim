import "server-only";
import { addisToday, isPast } from "./clock";
import { longDay, relative, relativeDay, time } from "./format";
import { getClinicSummary, getDoctor } from "./data";
import { displayPhone } from "./schema";
import { countAhead, getAppointment, listAppointmentsFor, listClinicDay } from "./store";

const STATUS_LABEL = { booked: "Booked", arrived: "Checked in", cancelled: "Cancelled" };

function present(a, now = new Date()) {
  const doctor = getDoctor(a.doctorId);
  const clinic = getClinicSummary(a.clinicId);
  const today = addisToday(now);
  const upcoming = a.status === "booked" && !isPast(a.startsAt, now);
  return {
    ...a,
    doctorName: doctor?.name ?? "Unknown doctor",
    clinicName: clinic?.name ?? "Unknown clinic",
    areaName: clinic?.areaName ?? "",
    timeLabel: time(a.startsAt),
    whenLabel: `${relativeDay(a.date, today)}, ${time(a.startsAt)}`,
    longWhen: `${longDay(a.date)} at ${time(a.startsAt)}`,
    fromNow: relative(a.startsAt, now),
    phoneLabel: displayPhone(a.phone),
    statusLabel: a.status === "booked" && !upcoming && a.date < today ? "Past" : STATUS_LABEL[a.status],
    isToday: a.date === today,
    upcoming,
    cancellable: upcoming,
    live: a.status === "booked" && a.date >= today,
  };
}

export async function appointmentsFor(userId) {
  const now = new Date();
  const mine = (await listAppointmentsFor(userId)).map((a) => present(a, now));
  const upcoming = mine.filter((a) => a.live).sort((x, y) => x.startsAt.localeCompare(y.startsAt));
  const earlier = mine.filter((a) => !a.live).sort((x, y) => y.startsAt.localeCompare(x.startsAt));
  return { upcoming, earlier };
}

export async function appointmentFor(userId, id) {
  const a = await getAppointment(id);
  if (!a || a.userId !== userId) return null;
  const shown = present(a);
  return { ...shown, queueAhead: shown.live && shown.isToday ? await countAhead(a) : null };
}

export async function clinicToday(clinicId) {
  const now = new Date();
  return (await listClinicDay(clinicId, addisToday(now)))
    .map((a) => present(a, now))
    .sort((x, y) => x.startsAt.localeCompare(y.startsAt) || x.doctorName.localeCompare(y.doctorName));
}

export async function checkCancel(userId, id) {
  const a = await getAppointment(id);
  if (!a) return { outcome: "not-found" };
  if (a.userId !== userId) return { outcome: "forbidden" };
  if (a.status === "cancelled") return { outcome: "already-cancelled", appointment: a };
  if (a.status === "arrived" || isPast(a.startsAt)) return { outcome: "too-late", appointment: a };
  return { outcome: "ok", appointment: a };
}

export async function checkArrive(session, id) {
  const a = await getAppointment(id);
  if (!a) return { outcome: "not-found" };
  if (session.role !== "reception" || a.clinicId !== session.clinicId) return { outcome: "forbidden" };
  if (a.date !== addisToday()) return { outcome: "not-today", appointment: a };
  if (a.status === "arrived") return { outcome: "already-arrived", appointment: a };
  if (a.status !== "booked") return { outcome: "cancelled", appointment: a };
  return { outcome: "ok", appointment: a };
}
