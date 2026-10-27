import "server-only";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

function envEndingWith(...suffixes) {
  for (const suffix of suffixes) {
    const key = Object.keys(process.env).find((k) => k.endsWith(suffix) && !k.includes("READ_ONLY") && process.env[k]);
    if (key) return process.env[key];
  }
  return undefined;
}
const REDIS_URL = envEndingWith("KV_REST_API_URL", "REDIS_REST_URL");
const REDIS_TOKEN = envEndingWith("KV_REST_API_TOKEN", "REDIS_REST_TOKEN");
const KEY_PREFIX = "hakim:";

export const STORE_KIND = REDIS_URL && REDIS_TOKEN ? "redis" : "file";

async function redis(command) {
  const res = await fetch(REDIS_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${REDIS_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(command),
    cache: "no-store",
  });
  const body = await res.json();
  if (!res.ok || body.error) throw new Error(`Redis ${command[0]} failed: ${body.error ?? res.status}`);
  return body.result;
}

const DIR = process.env.VERCEL ? path.join(os.tmpdir(), "hakim-data") : path.join(process.cwd(), ".data");

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
  await rename(tmp, file);
}

export function exclusive(fn) {
  const run = (globalThis.__hakimWriteQueue ?? Promise.resolve()).then(fn);
  globalThis.__hakimWriteQueue = run.catch(() => {});
  return run;
}
