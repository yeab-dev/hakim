import { STORE_KIND } from "@/lib/files";

export const dynamic = "force-dynamic";

export function GET() {
  return Response.json({ ok: true, store: STORE_KIND }, { headers: { "Cache-Control": "no-store" } });
}
