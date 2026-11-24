import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

const APP_ROUTES = ["/dashboard", "/invoices", "/clients", "/items", "/settings"];

// Optimistic check on the session cookie only: pages still verify the session on the
// server (see lib/session.ts) before showing any data.
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = Boolean(getSessionCookie(request));

  if (!hasSession && APP_ROUTES.some((route) => pathname.startsWith(route))) {
    const url = new URL("/sign-in", request.url);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/invoices/:path*",
    "/clients/:path*",
    "/items/:path*",
    "/settings/:path*",
  ],
};
