import { getSlot } from "@/lib/data";
import { problem } from "@/lib/http";

// GET /api/slots/:slotId
//   200 { slot: { id, date, time, startsAt, doctor, clinic, taken } }
//   404 { error }  not a real, future slot in the coming week
//
// Lets a caller check a time is still free before posting a booking.
export async function GET(_request, { params }) {
  const { slotId } = await params;
  const slot = await getSlot(slotId);
  if (!slot) return problem(404, "No such slot in the coming week");
  return Response.json({ slot }, { headers: { "Cache-Control": "no-store" } });
}
