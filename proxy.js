import { NextResponse } from "next/server";
import { SESSION_COOKIE, SESSION_TOKEN } from "./lib/session-cookie";

export function proxy(request) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (token && SESSION_TOKEN.test(token)) return NextResponse.next();

  const url = new URL("/login", request.url);
  url.searchParams.set("next", `${request.nextUrl.pathname}${request.nextUrl.search}`);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/appointments/:path*", "/book/:path*", "/reception/:path*"],
};
