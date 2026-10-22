import "server-only";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { displayPhone } from "./schema";

// A stand-in session, good enough to make authorisation real today.
//
// Signing in asks only for a phone number — there is no password or SMS code
// yet (that is Day 42/45). What *is* real: the cookie is httpOnly (no script
// can read it), and it is signed with an HMAC, so it cannot be edited to
// become somebody else's number. Every server action and route handler reads
// the user from here, never from a value the browser sent.
//
// The key is SESSION_SECRET from .env.local. Without one, a random key is made
// when the server starts — sessions then end on restart, but no secret is ever
// written into the source.

const COOKIE = "hakim_session";
const MAX_AGE = 60 * 60 * 24 * 7; // a week

function key() {
  if (process.env.SESSION_SECRET) return process.env.SESSION_SECRET;
  globalThis.__hakimSessionKey ??= randomBytes(32).toString("hex");
  return globalThis.__hakimSessionKey;
}

function signature(value) {
  return createHmac("sha256", key()).update(value).digest("base64url");
}

function seal(phone) {
  return `${phone}.${signature(phone)}`;
}

function unseal(token) {
  if (typeof token !== "string") return null;
  const dot = token.lastIndexOf(".");
  if (dot < 1) return null;
  const phone = token.slice(0, dot);
  const given = Buffer.from(token.slice(dot + 1));
  const expected = Buffer.from(signature(phone));
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
  return phone;
}

// Reading the cookie makes the calling route dynamic — which is why only the
// signed-in pages, the actions and the handlers call this, never the root
// layout.
export async function getUser() {
  const phone = unseal((await cookies()).get(COOKIE)?.value);
  return phone ? { phone, display: displayPhone(phone) } : null;
}

// For pages: the user, or off to /login with the way back in ?from=.
export async function requireUser(returnTo) {
  const user = await getUser();
  if (!user) redirect(`/login?from=${encodeURIComponent(returnTo)}`);
  return user;
}

// Setting and clearing only work in a server action or a route handler.
export async function startSession(phone) {
  (await cookies()).set(COOKIE, seal(phone), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function endSession() {
  (await cookies()).delete(COOKIE);
}
