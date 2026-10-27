import { revalidatePath } from "next/cache";
import { appointmentsFor } from "@/lib/appointments";
import { bookSlot } from "@/lib/booking";
import { NOT_SIGNED_IN, problem } from "@/lib/http";
import { parseBooking } from "@/lib/schema";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  if (!session) return NOT_SIGNED_IN();
  return Response.json(await appointmentsFor(session.userId), { headers: { "Cache-Control": "private, no-store" } });
}

export async function POST(request) {
  const session = await getSession();
  if (!session) return NOT_SIGNED_IN();

  let body;
  try {
    body = await request.json();
  } catch {
    return problem(400, "The body must be JSON");
  }

  const parsed = parseBooking(body);
  if (!parsed.success) return problem(422, "Validation failed", parsed.fieldErrors);

  const result = await bookSlot(session, parsed.data);
  if (result.status === "not-found") return problem(404, "No such slot in the coming week");
  if (result.status === "taken") return problem(409, "That slot is already booked");

  revalidatePath(`/clinics/${result.slot.clinic.id}`);
  revalidatePath("/appointments");
  return Response.json(
    { appointment: result.appointment },
    { status: 201, headers: { Location: `/appointments/${result.appointment.id}` } },
  );
}
