import { revalidatePath } from "next/cache";
import { appointmentsFor } from "@/lib/appointments";
import { bookSlot } from "@/lib/booking";
import { NOT_SIGNED_IN, problem } from "@/lib/http";
import { parseBooking } from "@/lib/schema";
import { getUser } from "@/lib/session";

// GET /api/appointments
//   200 { upcoming: [...], earlier: [...] }   the signed-in user's own
//   401 not signed in
export async function GET() {
  const user = await getUser();
  if (!user) return NOT_SIGNED_IN();
  return Response.json(await appointmentsFor(user.phone), { headers: { "Cache-Control": "private, no-store" } });
}

// POST /api/appointments
//   body { slotId, patientName, phone, reason, forSomeoneElse? }
//   201 { appointment }            Location: /appointments/:id
//   400 the body is not JSON
//   401 not signed in
//   404 the slot does not exist (or has passed)
//   409 the slot is already booked
//   422 { error, fieldErrors }     the values failed lib/schema.js
//
// The same rules and the same bookSlot() as the bookAppointment server action
// — the form's own checks are a courtesy; these are the rule.
export async function POST(request) {
  const user = await getUser();
  if (!user) return NOT_SIGNED_IN();

  let body;
  try {
    body = await request.json();
  } catch {
    return problem(400, "The body must be JSON");
  }

  const parsed = parseBooking(body);
  if (!parsed.success) return problem(422, "Validation failed", parsed.fieldErrors);

  const result = await bookSlot(user, parsed.data);
  if (result.status === "not-found") return problem(404, "No such slot in the coming week");
  if (result.status === "taken") return problem(409, "That slot is already booked");

  revalidatePath(`/clinics/${result.slot.clinic.id}`);
  revalidatePath("/appointments");
  return Response.json(
    { appointment: result.appointment },
    { status: 201, headers: { Location: `/appointments/${result.appointment.id}` } },
  );
}
