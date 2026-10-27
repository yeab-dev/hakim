import { revalidatePath } from "next/cache";
import { appointmentFor, checkCancel } from "@/lib/appointments";
import { NOT_SIGNED_IN, problem } from "@/lib/http";
import { getSession } from "@/lib/session";
import { markCancelled } from "@/lib/store";

export async function GET(_request, { params }) {
  const { appointmentId } = await params;
  const session = await getSession();
  if (!session) return NOT_SIGNED_IN();
  const appointment = await appointmentFor(session.userId, appointmentId);
  if (!appointment) return problem(404, "No such appointment");
  return Response.json({ appointment }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function DELETE(_request, { params }) {
  const { appointmentId } = await params;
  const session = await getSession();
  if (!session) return NOT_SIGNED_IN();

  const { outcome, appointment } = await checkCancel(session.userId, appointmentId);
  if (outcome === "not-found") return problem(404, "No such appointment");
  if (outcome === "forbidden") return problem(403, "You can only cancel your own bookings");
  if (outcome === "too-late") return problem(409, "This appointment has already started or been checked in");

  const updated = outcome === "ok" ? await markCancelled(appointment.id) : appointment;
  revalidatePath(`/clinics/${updated.clinicId}`);
  revalidatePath("/appointments");
  revalidatePath("/reception");
  return Response.json({ appointment: updated });
}
