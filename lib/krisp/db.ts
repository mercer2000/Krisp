import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

export default sql;

/**
 * Returns a neon() sql tagged template with the user's auth token attached.
 * RLS policies are enforced by Neon's proxy via the JWT.
 */
export function getAuthSql(token: string) {
  return neon(process.env.DATABASE_URL!, { authToken: token });
}
