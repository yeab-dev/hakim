import "server-only";
import { getSlot } from "./data";
import { createAppointment } from "./store";

export async function bookSlot(session, data) {
  const slot = await getSlot(data.slotId);
  if (!slot) return { status: "not-found" };
  if (slot.taken) return { status: "taken", slot };

  const result = await createAppointment({
    userId: session.userId,
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
