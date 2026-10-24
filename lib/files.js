import "server-only";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

// The three things Hakim writes — appointments, accounts and sessions — each
// live in one JSON collection. This module is the only code that stores them,
// and it has two backends behind the same three functions:
//
// - Redis, when the Upstash variables are set (on Vercel: Storage → Upstash
//   for Redis sets them). Every server instance reads and writes the same
//   data, which is what a serverless host needs: Vercel runs several
//   short-lived instances that share no disk, so a session written to one
//   instance's file was unknown to the next request's instance (measured:
//   1 sign-in in 8 survived three page loads). It is called through Upstash's
//   REST API with fetch, so there is no extra dependency.
// - A JSON file per collection otherwise: .data/ (git-ignored) for
//   `npm run dev` / `npm run start` on one machine, with no setup. On Vercel
//   without Redis, the project folder is read-only, so the files go to the
//   instance's /tmp — sign-in no longer crashes there, but data is per
//   instance, as above.
//
// LIMITATION, either way: a collection is read and written whole, and the
// lock below only orders writes inside one Node process. Two instances writing
// the same collection at the same moment could lose one write. That is fine
// for a demo; a real database with transactions removes it (FUTURE.md).

const REDIS_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const KEY_PREFIX = "hakim:";

export const STORE_KIND = REDIS_URL && REDIS_TOKEN ? "redis" : "file";

async function redis(command) {
  const res = await fetch(REDIS_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${REDIS_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(command),
    cache: "no-store", // always the live value, never Next's fetch cache
  });
  const body = await res.json();
  if (!res.ok || body.error) throw new Error(`Redis ${command[0]} failed: ${body.error ?? res.status}`);
  return body.result;
}

const DIR = process.env.VERCEL ? path.join(os.tmpdir(), "hakim-data") : path.join(process.cwd(), ".data");

// Reads the collection, or returns `fallback()` when it has never been written
// (the seed, until the first write).
export async function readCollection(name, fallback) {
  if (STORE_KIND === "redis") {
    const raw = await redis(["GET", KEY_PREFIX + name]);
    return raw === null ? fallback() : JSON.parse(raw);
  }
  try {
    return JSON.parse(await readFile(path.join(DIR, `${name}.json`), "utf8"));
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    return fallback();
  }
}

export async function writeCollection(name, rows) {
  if (STORE_KIND === "redis") {
    await redis(["SET", KEY_PREFIX + name, JSON.stringify(rows)]);
    return;
  }
  await mkdir(DIR, { recursive: true });
  const file = path.join(DIR, `${name}.json`);
  const tmp = `${file}.${process.pid}.tmp`;
  await writeFile(tmp, `${JSON.stringify(rows, null, 2)}\n`);
  await rename(tmp, file); // atomic: a reader never sees half a file
}

// One write at a time, across every collection, inside this process. Next.js
// may load a module more than once (pages, actions and route handlers are
// bundled separately), so the queue hangs off globalThis rather than a module
// variable.
export function exclusive(fn) {
  const run = (globalThis.__hakimWriteQueue ?? Promise.resolve()).then(fn);
  globalThis.__hakimWriteQueue = run.catch(() => {});
  return run;
}
