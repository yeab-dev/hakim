// The session cookie's name and shape, in a module with no server-only
// imports, so proxy.js can share it with lib/session.js.
//
// The cookie holds a random 32-byte token (43 base64url characters) and
// nothing else — no user id, no role. proxy.js can only tell that a cookie of
// the right shape is present; who it belongs to is answered by lib/session.js,
// which looks the token up.
export const SESSION_COOKIE = "hakim_session";
export const SESSION_TOKEN = /^[A-Za-z0-9_-]{43}$/;
