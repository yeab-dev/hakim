import "server-only";
import { getSlot } from "./data";
import { createAppointment } from "./store";

// Booking a slot, once the caller knows who is asking. Shared by the
// bookAppointment server action and POST /api/appointments, so the two cannot
// disagree about what "free" means. `user` always comes from the session
// cookie, never from the request body. `data` is the output of parseBooking().
//
// Returns { status: "created", appointment } | { status: "not-found" } |
// { status: "taken" }.
export async function bookSlot(user, data) {
  const slot = await getSlot(data.slotId);
  if (!slot) return { status: "not-found" };
  if (slot.taken) return { status: "taken", slot };

  const result = await createAppointment({
    userPhone: user.phone,
    slotId: slot.id,
    doctorId: slot.doctor.id,
    clinicId: slot.clinic.id,
    date: slot.date,
    time: slot.time,
    startsAt: slot.startsAt,
    patientName: data.patientName,
    phone: data.phone,
    reason: data.reason,
    forSomeoneElse: data.forSomeoneElse,
  });
  if (!result.ok) return { status: "taken", slot };
  return { status: "created", appointment: result.appointment, slot };
}
