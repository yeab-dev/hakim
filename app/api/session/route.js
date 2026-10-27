import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  const user = session ? { name: session.name, display: session.display, role: session.role } : null;
  return Response.json({ user }, { headers: { "Cache-Control": "private, no-store" } });
}
