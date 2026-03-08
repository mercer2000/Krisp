import { neon } from "@neondatabase/serverless";
import { auth } from "@/lib/auth/server";

const sql = neon(process.env.DATABASE_URL!);

export default sql;

/**
 * Returns a neon() sql tagged template with the user's auth token attached.
 * RLS policies are enforced by Neon's proxy via the JWT.
 */
export async function getAuthSql() {
  const { data: session } = await auth.getSession();
  if (!session?.session?.token) {
    throw new Error("No session token found");
  }
  return neon(process.env.DATABASE_URL!, {
    authToken: session.session.token,
  });
}
