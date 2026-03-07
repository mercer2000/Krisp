import { cookies } from "next/headers";
import { db } from "./index";

/**
 * Returns a Drizzle db instance with the user's JWT auth token attached.
 * Neon's proxy validates the JWT against the configured JWKS endpoint
 * and enforces RLS policies using auth.user_id() from the JWT `sub` claim.
 *
 * Use this for all user-scoped queries. Falls back to unauthenticated db
 * if no session cookie is found (will be blocked by RLS).
 */
export async function getAuthDb() {
  const cookieStore = await cookies();
  const token =
    cookieStore.get("__Secure-authjs.session-token")?.value ??
    cookieStore.get("authjs.session-token")?.value;

  if (!token) {
    throw new Error("No session token found");
  }

  return db.$withAuth(token);
}
