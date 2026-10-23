import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { cache } from "react";
import { getAccount } from "./accounts";
import { exclusive, readCollection, writeCollection } from "./files";
import { displayPhone } from "./schema";
import { SESSION_COOKIE, SESSION_TOKEN } from "./session-cookie";

// Sessions — the one place that knows how "who is asking" is answered.
// Every page, server action and route handler calls getSession(); none reads
// the cookie itself.
//
// A database session (Day 42's left-hand column): the cookie carries a random
// token; .data/sessions.json holds the SHA-256 of that token, the account id
// and an expiry. Storing only the hash means a copy of the sessions file
// cannot be replayed as cookies. Signing out deletes the row, so a session is
// revoked at once — which a signed token (JWT) cannot do before it expires.

const COLLECTION = "sessions";
const MAX_AGE = 60 * 60 * 24 * 7; // a week, in seconds

const digest = (token) => createHash("sha256").update(token).digest("base64url");
const load = () => readCollection(COLLECTION, () => []);

// The session's account, as every caller sees it:
//   { userId, name, phone, display, role, clinicId }  — or null.
// Wrapped in React's cache() so a page and its generateMetadata share one
// lookup per request. Reading cookies() makes the calling route dynamic,
// which is right for anything that depends on who is asking.
export const getSession = cache(async () => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token || !SESSION_TOKEN.test(token)) return null;

  const id = digest(token);
  const session = (await load()).find((s) => s.id === id);
  if (!session || Date.parse(session.expiresAt) <= Date.now()) return null;

  const account = await getAccount(session.userId);
  if (!account) return null;
  return {
    userId: account.id,
    name: account.name,
    phone: account.phone,
    display: displayPhone(account.phone),
    role: account.role,
    clinicId: account.clinicId ?? null,
  };
});

// For private pages: the session, or off to /login with the way back in ?next=.
export async function requireSession(returnTo) {
  const session = await getSession();
  if (!session) redirect(`/login?next=${encodeURIComponent(returnTo)}`);
  return session;
}

// For staff pages: signed in AND holding the role. A signed-in patient gets
// the not-found screen — the page does not confirm that it exists.
export async function requireRole(role, returnTo) {
  const session = await requireSession(returnTo);
  if (session.role !== role) notFound();
  return session;
}

// Setting and clearing only work in a server action or a route handler.
export async function startSession(userId) {
  const token = randomBytes(32).toString("base64url");
  const now = Date.now();
  await exclusive(async () => {
    const live = (await load()).filter((s) => Date.parse(s.expiresAt) > now); // prune expired
    live.push({
      id: digest(token),
      userId,
      createdAt: new Date(now).toISOString(),
      expiresAt: new Date(now + MAX_AGE * 1000).toISOString(),
    });
    await writeCollection(COLLECTION, live);
  });

  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true, // no script on the page can read it
    secure: process.env.NODE_ENV === "production", // HTTPS only (browsers treat localhost as secure)
    sameSite: "lax", // not sent on another site's POST
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function endSession() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token && SESSION_TOKEN.test(token)) {
    const id = digest(token);
    await exclusive(async () => {
      await writeCollection(COLLECTION, (await load()).filter((s) => s.id !== id));
    });
  }
  store.delete(SESSION_COOKIE);
}
