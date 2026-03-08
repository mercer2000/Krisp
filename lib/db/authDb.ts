import { auth } from "@/lib/auth/server";
import { db } from "./index";

/**
 * Returns a Drizzle db instance with the user's JWT auth token attached.
 * Neon Auth validates the JWT and enforces RLS policies using auth.user_id().
 */
export async function getAuthDb() {
  const { data: session } = await auth.getSession();

  if (!session?.session?.token) {
    throw new Error("No session token found");
  }

  return db.$withAuth(session.session.token);
}
