import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { cache } from "react";
import { getAccount } from "./accounts";
import { exclusive, readCollection, writeCollection } from "./files";
import { displayPhone } from "./schema";
import { SESSION_COOKIE, SESSION_TOKEN } from "./session-cookie";

const COLLECTION = "sessions";
const MAX_AGE = 60 * 60 * 24 * 7;

const digest = (token) => createHash("sha256").update(token).digest("base64url");
const load = () => readCollection(COLLECTION, () => []);

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

export async function requireSession(returnTo) {
  const session = await getSession();
  if (!session) redirect(`/login?next=${encodeURIComponent(returnTo)}`);
  return session;
}

export async function requireRole(role, returnTo) {
  const session = await requireSession(returnTo);
  if (session.role !== role) notFound();
  return session;
}

export async function startSession(userId) {
  const token = randomBytes(32).toString("base64url");
  const now = Date.now();
  await exclusive(async () => {
    const live = (await load()).filter((s) => Date.parse(s.expiresAt) > now);
    live.push({
      id: digest(token),
      userId,
      createdAt: new Date(now).toISOString(),
      expiresAt: new Date(now + MAX_AGE * 1000).toISOString(),
    });
    await writeCollection(COLLECTION, live);
  });

  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
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
