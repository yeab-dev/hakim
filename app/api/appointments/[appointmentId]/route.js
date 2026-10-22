import { revalidatePath } from "next/cache";
import { appointmentFor, checkCancel } from "@/lib/appointments";
import { NOT_SIGNED_IN, problem } from "@/lib/http";
import { getUser } from "@/lib/session";
import { markCancelled } from "@/lib/store";

// GET /api/appointments/:id
//   200 { appointment }  401 not signed in  404 no such booking *of yours*
export async function GET(_request, { params }) {
  const { appointmentId } = await params;
  const user = await getUser();
  if (!user) return NOT_SIGNED_IN();
  const appointment = await appointmentFor(user.phone, appointmentId);
  if (!appointment) return problem(404, "No such appointment");
  return Response.json({ appointment }, { headers: { "Cache-Control": "private, no-store" } });
}

// DELETE /api/appointments/:id — cancel it
//   200 { appointment }  cancelled (or already was)
//   401 not signed in
//   403 signed in, but the booking is somebody else's
//   404 no such booking
//   409 it has already started
//
// The id in the URL is only a claim. Who is asking comes from the cookie, and
// the booking must belong to them — checked here, in the handler itself.
export async function DELETE(_request, { params }) {
  const { appointmentId } = await params;
  const user = await getUser();
  if (!user) return NOT_SIGNED_IN();

  const { outcome, appointment } = await checkCancel(user.phone, appointmentId);
  if (outcome === "not-found") return problem(404, "No such appointment");
  if (outcome === "forbidden") return problem(403, "You can only cancel your own bookings");
  if (outcome === "too-late") return problem(409, "This appointment has already started");

  const updated = outcome === "ok" ? await markCancelled(appointment.id) : appointment;
  revalidatePath(`/clinics/${updated.clinicId}`);
  revalidatePath("/appointments");
  return Response.json({ appointment: updated });
}
