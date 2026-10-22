import "server-only";
import { addisToday, isPast, longDayLabel, relativeDayLabel } from "./clock";
import { getClinicSummary, getDoctor } from "./data";
import { displayPhone } from "./schema";
import { getAppointment, listAppointmentsFor } from "./store";

// Appointments as the pages show them: with names, labels and whether they
// are still ahead. No permission logic here except "only the owner's".

function present(a, now = new Date()) {
  const doctor = getDoctor(a.doctorId);
  const clinic = getClinicSummary(a.clinicId);
  const upcoming = a.status === "booked" && !isPast(a.startsAt, now);
  return {
    ...a,
    doctorName: doctor?.name ?? "Unknown doctor",
    clinicName: clinic?.name ?? "Unknown clinic",
    areaName: clinic?.areaName ?? "",
    whenLabel: `${relativeDayLabel(a.date, addisToday(now))}, ${a.time}`,
    longWhen: `${longDayLabel(a.date)} at ${a.time}`,
    phoneLabel: displayPhone(a.phone),
    upcoming,
    cancellable: upcoming,
  };
}

// The signed-in user's bookings: upcoming first (soonest first), then
// everything else — past or cancelled — most recent first.
export async function appointmentsFor(userPhone) {
  const now = new Date();
  const mine = (await listAppointmentsFor(userPhone)).map((a) => present(a, now));
  const upcoming = mine.filter((a) => a.upcoming).sort((x, y) => x.startsAt.localeCompare(y.startsAt));
  const earlier = mine.filter((a) => !a.upcoming).sort((x, y) => y.startsAt.localeCompare(x.startsAt));
  return { upcoming, earlier };
}

// One booking, but only for its owner. Someone else's id gets null — the same
// answer as an id that does not exist, so the page does not even confirm
// that it exists.
export async function appointmentFor(userPhone, id) {
  const a = await getAppointment(id);
  if (!a || a.userPhone !== userPhone) return null;
  return present(a);
}

// The cancel rules, for the action and the handler to call *after* they have
// established who is asking. Returns "not-found" | "forbidden" | "too-late" |
// "already-cancelled" | "ok", plus the record when there is one.
export async function checkCancel(userPhone, id) {
  const a = typeof id === "string" ? await getAppointment(id) : null;
  if (!a) return { outcome: "not-found" };
  if (a.userPhone !== userPhone) return { outcome: "forbidden" };
  if (a.status === "cancelled") return { outcome: "already-cancelled", appointment: a };
  if (isPast(a.startsAt)) return { outcome: "too-late", appointment: a };
  return { outcome: "ok", appointment: a };
}
