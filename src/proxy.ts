import { NextResponse } from "next/server";
import { auth } from "@/auth";

const PUBLIC_PATHS = ["/login", "/signup", "/find-id", "/forgot-password", "/reset-password"];
// Only these send an already-logged-in visitor back to "/" — the others
// (find-id, forgot/reset-password) stay usable even while logged in, e.g. a
// reset link clicked from a session that's still logged in elsewhere.
const REDIRECT_IF_LOGGED_IN_PATHS = ["/login", "/signup"];

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const { pathname } = req.nextUrl;
  const isPublicPath = PUBLIC_PATHS.some((path) => pathname.startsWith(path));
  const isAuthOnlyPath = REDIRECT_IF_LOGGED_IN_PATHS.some((path) => pathname.startsWith(path));

  if (!isLoggedIn && !isPublicPath) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    return NextResponse.redirect(loginUrl);
  }

  if (isLoggedIn && isAuthOnlyPath) {
    return NextResponse.redirect(new URL("/", req.nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  // Run on every route except static assets and API routes (API routes
  // enforce their own auth checks via `auth()`).
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
