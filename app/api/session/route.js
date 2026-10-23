import { getSession } from "@/lib/session";

// GET /api/session → 200 { user: { name, display, role } } or { user: null }
//
// The one endpoint the header calls: the root layout never reads the cookie
// (which would make every route dynamic), so the header asks from the browser.
// Only what the header shows — no ids, no clinic, nothing to act on. The role
// is for *showing* a Reception link; /reception and its action check it again.
export async function GET() {
  const session = await getSession();
  const user = session ? { name: session.name, display: session.display, role: session.role } : null;
  return Response.json({ user }, { headers: { "Cache-Control": "private, no-store" } });
}
