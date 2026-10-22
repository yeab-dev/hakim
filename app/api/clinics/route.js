import { isArea, isSpecialty, listClinics } from "@/lib/data";
import { problem } from "@/lib/http";

// GET /api/clinics?specialty=&area=
//   200 { clinics: [...] }   each with its soonest open slot
//   400 { error, fieldErrors } an unknown specialty or area
//
// Hakim's own pages do not call this — they read lib/data.js directly. It is
// for a caller outside the site (a mobile app, a partner clinic's page).
// Reading request.url makes the handler dynamic, which is right: the soonest
// slot changes with every booking.
export async function GET(request) {
  const query = new URL(request.url).searchParams;
  const specialty = query.get("specialty") || undefined;
  const area = query.get("area") || undefined;

  const fieldErrors = {};
  if (specialty && !isSpecialty(specialty)) fieldErrors.specialty = `No specialty called "${specialty}"`;
  if (area && !isArea(area)) fieldErrors.area = `No area called "${area}"`;
  if (Object.keys(fieldErrors).length > 0) return problem(400, "Unknown filter", fieldErrors);

  const clinics = await listClinics({ specialty, area, slow: false });
  return Response.json({ clinics });
}
