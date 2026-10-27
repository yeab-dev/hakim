import { getSlot } from "@/lib/data";
import { problem } from "@/lib/http";

export async function GET(_request, { params }) {
  const { slotId } = await params;
  const slot = await getSlot(slotId);
  if (!slot) return problem(404, "No such slot in the coming week");
  return Response.json({ slot }, { headers: { "Cache-Control": "no-store" } });
}
