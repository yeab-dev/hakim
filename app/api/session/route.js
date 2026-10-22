import { getUser } from "@/lib/session";

// GET /api/session → 200 { user: { phone, display } } or { user: null }
//
// The one endpoint this site's own pages call: the header's AuthProvider asks
// it from the browser, so the root layout never has to read the cookie (which
// would make every route dynamic). Reading cookies makes this handler dynamic.
export async function GET() {
  const user = await getUser();
  return Response.json({ user }, { headers: { "Cache-Control": "private, no-store" } });
}
