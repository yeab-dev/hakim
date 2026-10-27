import { searchDirectory } from "@/lib/data";

export async function GET(request) {
  const query = (new URL(request.url).searchParams.get("q") ?? "").slice(0, 80);
  return Response.json(
    { query, ...searchDirectory(query) },
    { headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300" } },
  );
}
