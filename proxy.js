import { NextResponse } from "next/server";
import { SESSION_COOKIE, SESSION_TOKEN } from "./lib/session-cookie";

// Layer 1 of 3 on the private routes. In Next.js 16 the file the course calls
// middleware.js is named proxy.js and exports `proxy` — same job, new name.
//
// What it proves: a session cookie *of the right shape* is present. Nothing
// more — it does not look the token up, so an expired, revoked or invented
// token gets through to the page, whose getSession() refuses it. Its value is
// cheapness: a visitor with no cookie at all is redirected before any page,
// layout or data read runs.
export function proxy(request) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (token && SESSION_TOKEN.test(token)) return NextResponse.next();

  const url = new URL("/login", request.url);
  // Remember where they were going; /login checks it before using it.
  url.searchParams.set("next", `${request.nextUrl.pathname}${request.nextUrl.search}`);
  return NextResponse.redirect(url);
}

// Narrow on purpose: only the private pages. Not /api (handlers answer 401
// themselves, as an API should), not static files or images, not the public
// pages.
export const config = {
  matcher: ["/appointments/:path*", "/book/:path*", "/reception/:path*"],
};
