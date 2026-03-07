/**
 * Creates the PostgreSQL roles needed for Neon Authorize RLS.
 * Run with: npx tsx scripts/setup-neon-rls-roles.ts
 *
 * These roles are normally created when you enable Neon Authorize in the console,
 * but we create them manually if they don't exist yet.
 */
import { neon } from "@neondatabase/serverless";

async function main() {
  const sql = neon(process.env.DATABASE_URL!);

  // Create 'authenticated' role if it doesn't exist
  try {
    await sql.query(`DO $$
    BEGIN
      IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'authenticated') THEN
        CREATE ROLE authenticated NOLOGIN;
        RAISE NOTICE 'Created role: authenticated';
      ELSE
        RAISE NOTICE 'Role authenticated already exists';
      END IF;
    END
    $$;`);
    console.log("✓ Role 'authenticated' ready");
  } catch (err: any) {
    console.error("✗ Failed to create authenticated role:", err.message);
    throw err;
  }

  // Create 'anonymous' role if it doesn't exist
  try {
    await sql.query(`DO $$
    BEGIN
      IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'anonymous') THEN
        CREATE ROLE anonymous NOLOGIN;
        RAISE NOTICE 'Created role: anonymous';
      ELSE
        RAISE NOTICE 'Role anonymous already exists';
      END IF;
    END
    $$;`);
    console.log("✓ Role 'anonymous' ready");
  } catch (err: any) {
    console.error("✗ Failed to create anonymous role:", err.message);
    throw err;
  }

  // Grant basic permissions to authenticated role
  try {
    await sql.query(`GRANT USAGE ON SCHEMA public TO authenticated;`);
    await sql.query(`GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;`);
    await sql.query(`GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;`);
    await sql.query(`ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;`);
    await sql.query(`ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE ON SEQUENCES TO authenticated;`);
    console.log("✓ Permissions granted to 'authenticated' role");
  } catch (err: any) {
    console.error("✗ Failed to grant permissions:", err.message);
    throw err;
  }

  console.log("\nDone! Roles are ready for RLS policies.");
}

main().catch((err) => {
  console.error("Setup failed:", err.message);
  process.exit(1);
});
