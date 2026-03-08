import { auth } from "@/lib/auth/server";

export default auth.middleware({
  loginUrl: "/auth/sign-in",
});

export const config = {
  matcher: [
    // Protect all routes EXCEPT:
    // - api/, _next/static, _next/image, images/, favicon.ico (infra)
    // - auth/ (auth pages themselves)
    // - root /, pricing, checkout (marketing pages)
    "/((?!api/|_next/static|_next/image|images/|favicon.ico|auth/|pricing|checkout).+)",
  ],
};
