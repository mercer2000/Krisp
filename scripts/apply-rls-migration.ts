/**
 * Applies the RLS migration directly to the database.
 * Run with: npx tsx scripts/apply-rls-migration.ts
 */
import { neon } from "@neondatabase/serverless";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const sql = neon(process.env.DATABASE_URL!);

  const migrationPath = path.join(
    __dirname,
    "../drizzle/migrations/0022_add-row-level-security.sql"
  );
  const migrationSql = fs.readFileSync(migrationPath, "utf-8");

  // Split on the drizzle statement breakpoint markers
  const statements = migrationSql
    .split("--> statement-breakpoint")
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.startsWith("--"));

  console.log(`Applying ${statements.length} RLS statements...`);

  let applied = 0;
  let skipped = 0;

  for (const stmt of statements) {
    // Strip leading SQL comments from statement
    const cleanStmt = stmt
      .split("\n")
      .filter((line) => !line.trim().startsWith("--"))
      .join("\n")
      .trim();

    if (!cleanStmt) {
      skipped++;
      continue;
    }

    try {
      await sql.query(cleanStmt);
      applied++;
      // Show progress
      if (cleanStmt.includes("ENABLE ROW LEVEL SECURITY")) {
        const tableName = cleanStmt.match(/"(\w+)"/)?.[1] ?? "?";
        console.log(`  ✓ RLS enabled on ${tableName}`);
      } else if (cleanStmt.includes("CREATE POLICY")) {
        const policyName = cleanStmt.match(/"([\w-]+)"/)?.[1] ?? "?";
        const tableName = cleanStmt.match(/ON "(\w+)"/)?.[1] ?? "?";
        console.log(`  ✓ Policy ${policyName} on ${tableName}`);
      }
    } catch (err: any) {
      if (err.message?.includes("already exists")) {
        skipped++;
        const name = cleanStmt.match(/"([\w-]+)"/)?.[1] ?? "?";
        console.log(`  ⊘ Skipped (already exists): ${name}`);
      } else {
        console.error(`  ✗ Failed: ${cleanStmt.substring(0, 80)}...`);
        console.error(`    Error: ${err.message}`);
        throw err;
      }
    }
  }

  console.log(`\nDone! Applied: ${applied}, Skipped: ${skipped}`);
}

main().catch((err) => {
  console.error("Migration failed:", err.message);
  process.exit(1);
});
