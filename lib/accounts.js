import "server-only";
import { randomBytes } from "node:crypto";
import seed from "@/data/accounts.json";
import { exclusive, readCollection, writeCollection } from "./files";
import { DECOY_HASH, hashPassword, verifyPassword } from "./password";

// Accounts: { id, name, phone (+2519…), role, clinicId?, passwordHash, createdAt }.
// Roles: "patient" (anyone who signs up) and "reception" (clinic staff, one
// clinic each — only seeded, never self-assigned).
//
// Until the first sign-up the seed in data/accounts.json is used. Its hashes
// are of the demo passwords listed in the README.

const COLLECTION = "accounts";
const load = () => readCollection(COLLECTION, () => seed);

export async function getAccount(id) {
  return (await load()).find((a) => a.id === id) ?? null;
}

// A small brake on guessing: five wrong passwords for one number in fifteen
// minutes locks that number for the rest of the window. In memory, so it
// resets on restart and is per server — a real deployment would keep this in
// shared storage.
const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES = 5;
const failures = (globalThis.__hakimSignInFailures ??= new Map());

function recentFailures(phone, now = Date.now()) {
  const list = (failures.get(phone) ?? []).filter((t) => now - t < WINDOW_MS);
  failures.set(phone, list);
  return list;
}

// "ok" with the account, "locked", or "invalid" — one answer for both a wrong
// password and an unknown number, so the form does not reveal who has an
// account.
export async function checkCredentials(phone, password) {
  if (recentFailures(phone).length >= MAX_FAILURES) return { outcome: "locked" };
  const account = (await load()).find((a) => a.phone === phone);
  const matches = await verifyPassword(password, account?.passwordHash ?? DECOY_HASH);
  if (!account || !matches) {
    recentFailures(phone).push(Date.now());
    return { outcome: "invalid" };
  }
  failures.delete(phone);
  return { outcome: "ok", account };
}

// A new patient account. Returns { ok: false } if the number is already
// registered (checked inside the same exclusive step as the write).
export async function createAccount({ name, phone, password }) {
  const passwordHash = await hashPassword(password);
  return exclusive(async () => {
    const all = await load();
    if (all.some((a) => a.phone === phone)) return { ok: false };
    const account = {
      id: `usr_${randomBytes(8).toString("hex")}`,
      name,
      phone,
      role: "patient",
      passwordHash,
      createdAt: new Date().toISOString(),
    };
    await writeCollection(COLLECTION, [...all, account]);
    return { ok: true, account };
  });
}
