import { neon } from "@neondatabase/serverless";

async function main() {
  const sql = neon(process.env.DATABASE_URL!);

  // Check if pg_session_jwt extension is installed
  try {
    await sql.query("CREATE EXTENSION IF NOT EXISTS pg_session_jwt;");
    console.log("✓ pg_session_jwt extension installed");
  } catch (e: any) {
    console.error("✗ pg_session_jwt error:", e.message);
  }

  // Check if auth schema exists
  try {
    const result = await sql.query(
      "SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'auth'"
    );
    if (result.length > 0) {
      console.log("✓ auth schema exists");
    } else {
      console.log("✗ auth schema does NOT exist");
    }
  } catch (e: any) {
    console.error("✗ Schema check error:", e.message);
  }

  // Check if auth.user_id() function exists
  try {
    const result = await sql.query(
      "SELECT routine_name FROM information_schema.routines WHERE routine_schema = 'auth' AND routine_name = 'user_id'"
    );
    if (result.length > 0) {
      console.log("✓ auth.user_id() function exists");
    } else {
      console.log("✗ auth.user_id() function does NOT exist");
    }
  } catch (e: any) {
    console.error("✗ Function check error:", e.message);
  }

  // List installed extensions
  try {
    const exts = await sql.query(
      "SELECT extname, extversion FROM pg_extension ORDER BY extname"
    );
    console.log("\nInstalled extensions:");
    for (const ext of exts) {
      console.log(`  ${ext.extname} v${ext.extversion}`);
    }
  } catch (e: any) {
    console.error("Extension list error:", e.message);
  }
}

main().catch(console.error);
