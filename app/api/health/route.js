import { STORE_KIND } from "@/lib/files";

// GET /api/health
//   200 { ok, store }   which backend lib/files.js is using: "redis" or "file"
//
// Not a secret: it names the kind of store, never its address or token. It
// exists so a deployment can be checked from outside (README, Deployment).
export const dynamic = "force-dynamic";

export function GET() {
  return Response.json({ ok: true, store: STORE_KIND }, { headers: { "Cache-Control": "no-store" } });
}
