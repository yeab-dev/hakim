import "server-only";
import { randomBytes } from "node:crypto";
import seed from "@/data/accounts.json";
import { exclusive, readCollection, writeCollection } from "./files";
import { DECOY_HASH, hashPassword, verifyPassword } from "./password";

const COLLECTION = "accounts";
const load = () => readCollection(COLLECTION, () => seed);

export async function getAccount(id) {
  return (await load()).find((a) => a.id === id) ?? null;
}

const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES = 5;
const failures = (globalThis.__hakimSignInFailures ??= new Map());

function recentFailures(phone, now = Date.now()) {
  const list = (failures.get(phone) ?? []).filter((t) => now - t < WINDOW_MS);
  failures.set(phone, list);
  return list;
}

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
