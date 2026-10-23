import "server-only";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

// The three things Hakim writes — appointments, accounts and sessions — each
// live in one JSON file under .data/ (git-ignored). This module is the only
// code that touches those files.
//
// LIMITATION, on purpose until a database arrives: the files live on the disk
// of the machine running `next start`. That is right for one server on one
// disk and wrong for a serverless host (read-only or throw-away disks) or more
// than one server. There are no transactions, only a lock inside one Node
// process. A database replaces this module; its callers do not change.

const DIR = path.join(process.cwd(), ".data");

// Reads .data/<name>.json, or returns `fallback()` when the file does not exist
// yet (the seed, until the first write).
export async function readCollection(name, fallback) {
  try {
    return JSON.parse(await readFile(path.join(DIR, `${name}.json`), "utf8"));
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    return fallback();
  }
}

export async function writeCollection(name, rows) {
  await mkdir(DIR, { recursive: true });
  const file = path.join(DIR, `${name}.json`);
  const tmp = `${file}.${process.pid}.tmp`;
  await writeFile(tmp, `${JSON.stringify(rows, null, 2)}\n`);
  await rename(tmp, file); // atomic: a reader never sees half a file
}

// One write at a time, across every collection. Next.js may load a module more
// than once (pages, actions and route handlers are bundled separately), so the
// queue hangs off globalThis rather than a module variable.
export function exclusive(fn) {
  const run = (globalThis.__hakimWriteQueue ?? Promise.resolve()).then(fn);
  globalThis.__hakimWriteQueue = run.catch(() => {});
  return run;
}
