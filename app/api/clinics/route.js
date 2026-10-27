import { isArea, isSpecialty, listClinics } from "@/lib/data";
import { problem } from "@/lib/http";

export async function GET(request) {
  const query = new URL(request.url).searchParams;
  const specialty = query.get("specialty") || undefined;
  const area = query.get("area") || undefined;

  const fieldErrors = {};
  if (specialty && !isSpecialty(specialty)) fieldErrors.specialty = `No specialty called "${specialty}"`;
  if (area && !isArea(area)) fieldErrors.area = `No area called "${area}"`;
  if (Object.keys(fieldErrors).length > 0) return problem(400, "Unknown filter", fieldErrors);

  const clinics = await listClinics({ specialty, area });
  return Response.json({ clinics });
}
