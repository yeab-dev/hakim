import "server-only";
import { addisToday, isPast } from "./clock";
import { longDay, relative, relativeDay, time } from "./format";
import { getClinicSummary, getDoctor } from "./data";
import { displayPhone } from "./schema";
import { countAhead, getAppointment, listAppointmentsFor, listClinicDay, listClinicRange } from "./store";

// Appointments as the pages show them: with names, labels and whether they
// are still ahead. Every read here takes its scope — a userId or a clinicId —
// as an argument, and every caller passes the one from getSession(), never
// one from the request.

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
    // "in 2 days", "3 hours ago": how far off, at the moment the page was made.
    fromNow: relative(a.startsAt, now),
    phoneLabel: displayPhone(a.phone),
    statusLabel: a.status === "booked" && !upcoming && a.date < today ? "Past" : STATUS_LABEL[a.status],
    isToday: a.date === today,
    upcoming,
    cancellable: upcoming,
    // Still able to change on its own (reception checks the patient in), so
    // worth polling: booked, and today or later.
    live: a.status === "booked" && a.date >= today,
  };
}

// The signed-in user's bookings: upcoming first (soonest first), then
// everything else — past, checked in or cancelled — most recent first.
export async function appointmentsFor(userId) {
  const now = new Date();
  const mine = (await listAppointmentsFor(userId)).map((a) => present(a, now));
  const upcoming = mine.filter((a) => a.live).sort((x, y) => x.startsAt.localeCompare(y.startsAt));
  const earlier = mine.filter((a) => !a.live).sort((x, y) => y.startsAt.localeCompare(x.startsAt));
  return { upcoming, earlier };
}

// One booking, but only for its owner. Someone else's id gets null — the same
// answer as an id that does not exist, so the page does not even confirm
// that it exists. Today's live bookings also say how many patients are ahead.
export async function appointmentFor(userId, id) {
  const a = await getAppointment(id);
  if (!a || a.userId !== userId) return null;
  const shown = present(a);
  return { ...shown, queueAhead: shown.live && shown.isToday ? await countAhead(a) : null };
}

// Reception: one clinic's bookings for today, in time order. `clinicId` comes
// from the staff member's account, not from the URL.
export async function clinicToday(clinicId) {
  const now = new Date();
  return (await listClinicDay(clinicId, addisToday(now)))
    .map((a) => present(a, now))
    .sort((x, y) => x.startsAt.localeCompare(y.startsAt) || x.doctorName.localeCompare(y.doctorName));
}

// Reception's week view: one clinic's bookings between two dates, with the
// doctor's fee. Scoped by the clinicId from the staff member's session.
export async function clinicRange(clinicId, from, to) {
  const now = new Date();
  return (await listClinicRange(clinicId, from, to)).map((a) => ({
    ...present(a, now),
    fee: getDoctor(a.doctorId)?.fee ?? 0,
  }));
}

// The cancel rules, for the action and the handler to call *after* they have
// established who is asking. Returns "not-found" | "forbidden" | "too-late" |
// "already-cancelled" | "ok", plus the record when there is one.
export async function checkCancel(userId, id) {
  const a = await getAppointment(id);
  if (!a) return { outcome: "not-found" };
  if (a.userId !== userId) return { outcome: "forbidden" };
  if (a.status === "cancelled") return { outcome: "already-cancelled", appointment: a };
  if (a.status === "arrived" || isPast(a.startsAt)) return { outcome: "too-late", appointment: a };
  return { outcome: "ok", appointment: a };
}

// The check-in rules, for reception. The caller has already established that
// the session is a reception account; this checks the record is that
// account's clinic's, today's, and still booked.
export async function checkArrive(session, id) {
  const a = await getAppointment(id);
  if (!a) return { outcome: "not-found" };
  if (session.role !== "reception" || a.clinicId !== session.clinicId) return { outcome: "forbidden" };
  if (a.date !== addisToday()) return { outcome: "not-today", appointment: a };
  if (a.status === "arrived") return { outcome: "already-arrived", appointment: a };
  if (a.status !== "booked") return { outcome: "cancelled", appointment: a };
  return { outcome: "ok", appointment: a };
}
