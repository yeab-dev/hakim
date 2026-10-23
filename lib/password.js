import "server-only";
import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

// Passwords are never stored — only a salted scrypt hash, in one string:
//   scrypt$<N>$<r>$<p>$<salt, base64url>$<hash, base64url>
// scrypt is built into Node (no native module to install) and, like bcrypt or
// argon2, is deliberately slow and memory-hungry, so a stolen accounts file
// cannot be reversed by brute force cheaply. The parameters travel with the
// hash, so they can be raised later without breaking old accounts.

const scrypt = promisify(scryptCallback);
const N = 16384;
const R = 8;
const P = 1;
const KEY_LENGTH = 32;

export async function hashPassword(password) {
  const salt = randomBytes(16);
  const hash = await scrypt(password.normalize("NFKC"), salt, KEY_LENGTH, { N, r: R, p: P });
  return ["scrypt", N, R, P, salt.toString("base64url"), hash.toString("base64url")].join("$");
}

export async function verifyPassword(password, stored) {
  const [scheme, n, r, p, salt, hash] = String(stored).split("$");
  if (scheme !== "scrypt" || !salt || !hash) return false;
  const expected = Buffer.from(hash, "base64url");
  const actual = await scrypt(String(password).normalize("NFKC"), Buffer.from(salt, "base64url"), expected.length, {
    N: Number(n),
    r: Number(r),
    p: Number(p),
  });
  return timingSafeEqual(actual, expected);
}

// Compared against when the phone number has no account, so "no such account"
// takes as long as "wrong password" and the timing does not reveal which
// numbers are registered.
export const DECOY_HASH =
  "scrypt$16384$8$1$AAAAAAAAAAAAAAAAAAAAAA$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";
