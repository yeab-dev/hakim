import { searchDirectory } from "@/lib/data";

// GET /api/search?q=hanna
//   200 { query, clinics: [{ id, name, areaName }], doctors: [{ id, name, specialtyName, clinicId, clinicName }] }
//
// The search box on /clinics calls this as you type (debounced, through SWR).
// Public: names from the build only — no bookings, no session — so a shared
// cache may keep an answer for a minute.
export async function GET(request) {
  const query = (new URL(request.url).searchParams.get("q") ?? "").slice(0, 80);
  return Response.json(
    { query, ...searchDirectory(query) },
    { headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300" } },
  );
}
