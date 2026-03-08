import { auth } from "./auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const pathname = req.nextUrl.pathname;

  // Auth pages: redirect logged-in users to /boards
  const isAuthPage =
    pathname === "/" ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/reset-password");

  // Public pages accessible to everyone (even logged-in users)
  const isPublicPage =
    pathname.startsWith("/pricing") ||
    pathname.startsWith("/checkout");

  if (!isLoggedIn && !isAuthPage && !isPublicPage) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (isLoggedIn && isAuthPage) {
    return NextResponse.redirect(new URL("/boards", req.url));
  }
});

export const config = {
  matcher: ["/((?!api/|_next/static|_next/image|images/|favicon.ico).*)"],
};
