/**
 * One-time migration script: encrypt existing plaintext data in-place.
 *
 * Usage:
 *   npx tsx scripts/encrypt-existing-data.ts [--dry-run]
 *
 * Environment:
 *   DATABASE_URL   — Neon connection string
 *   ENCRYPTION_KEY — 64-char hex (32 bytes for AES-256-GCM)
 *
 * Behaviour:
 *   - Reads rows in batches of 100
 *   - Skips values already encrypted (enc:v1: prefix)
 *   - Skips null values
 *   - Commits each row update individually for resumability
 *   - In --dry-run mode, prints counts without writing
 *   - Idempotent: safe to re-run
 */

import { neon } from "@neondatabase/serverless";
import { encrypt, isEncrypted } from "../lib/encryption";



const DRY_RUN = process.argv.includes("--dry-run");

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL env var is required");
  process.exit(1);
}

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
if (!ENCRYPTION_KEY) {
  console.error("ENCRYPTION_KEY env var is required");
  process.exit(1);
}

const sql = neon(DATABASE_URL);

interface TableSpec {
  table: string;
  idColumn: string;
  idType: "uuid" | "serial";
  columns: string[];
}

const TABLES: TableSpec[] = [
  {
    table: "webhook_key_points",
    idColumn: "id",
    idType: "serial",
    columns: ["meeting_title", "raw_meeting", "raw_content"],
  },
  {
    table: "emails",
    idColumn: "id",
    idType: "serial",
    columns: ["sender", "subject", "body_plain_text", "body_html"],
  },
  {
    table: "gmail_emails",
    idColumn: "id",
    idType: "uuid",
    columns: ["sender", "subject", "body_plain", "body_html"],
  },
  {
    table: "decisions",
    idColumn: "id",
    idType: "uuid",
    columns: ["statement", "context", "rationale", "annotation"],
  },
  {
    table: "action_items",
    idColumn: "id",
    idType: "uuid",
    columns: ["title", "description", "assignee"],
  },
  {
    table: "cards",
    idColumn: "id",
    idType: "uuid",
    columns: ["title", "description"],
  },
  {
    table: "brain_chat_messages",
    idColumn: "id",
    idType: "uuid",
    columns: ["content"],
  },
  {
    table: "brain_chat_sessions",
    idColumn: "id",
    idType: "uuid",
    columns: ["title"],
  },
  {
    table: "calendar_events",
    idColumn: "id",
    idType: "uuid",
    columns: ["subject", "body_preview", "body_html", "location"],
  },
  {
    table: "zoom_chat_messages",
    idColumn: "id",
    idType: "uuid",
    columns: ["message_content", "sender_name"],
  },
  {
    table: "weekly_reviews",
    idColumn: "id",
    idType: "uuid",
    columns: ["synthesis_report"],
  },
];

const BATCH_SIZE = 100;

async function migrateTable(spec: TableSpec) {
  const { table, idColumn, columns } = spec;
  const selectCols = [idColumn, ...columns].join(", ");

  let totalRows = 0;
  let encryptedFields = 0;
  let skippedFields = 0;
  let offset = 0;

  console.log(`\n--- ${table} ---`);

  while (true) {
    const rows = await sql.query(
      `SELECT ${selectCols} FROM ${table} ORDER BY ${idColumn} LIMIT ${BATCH_SIZE} OFFSET ${offset}`
    );

    if (rows.length === 0) break;

    for (const row of rows) {
      const updates: Record<string, string> = {};
      let hasUpdate = false;

      for (const col of columns) {
        const value = row[col];
        if (value === null || value === undefined) continue;
        if (typeof value !== "string") continue;
        if (isEncrypted(value)) {
          skippedFields++;
          continue;
        }
        // Plaintext value — needs encryption
        updates[col] = encrypt(value);
        hasUpdate = true;
        encryptedFields++;
      }

      if (hasUpdate && !DRY_RUN) {
        const setClauses = Object.keys(updates)
          .map((col, i) => `${col} = $${i + 2}`)
          .join(", ");
        const values = [row[idColumn], ...Object.values(updates)];
        await sql.query(
          `UPDATE ${table} SET ${setClauses} WHERE ${idColumn} = $1`,
          values
        );
      }

      totalRows++;
    }

    offset += BATCH_SIZE;
    process.stdout.write(`  processed ${offset} rows...\r`);
  }

  console.log(
    `  ${table}: ${totalRows} rows, ${encryptedFields} fields encrypted, ${skippedFields} already encrypted${DRY_RUN ? " (DRY RUN)" : ""}`
  );

  return { totalRows, encryptedFields, skippedFields };
}

async function main() {
  console.log(`Encryption migration ${DRY_RUN ? "(DRY RUN)" : ""}`);
  console.log(`Tables: ${TABLES.length}`);

  let grandTotal = 0;
  let grandEncrypted = 0;
  let grandSkipped = 0;

  for (const spec of TABLES) {
    try {
      const { totalRows, encryptedFields, skippedFields } =
        await migrateTable(spec);
      grandTotal += totalRows;
      grandEncrypted += encryptedFields;
      grandSkipped += skippedFields;
    } catch (err) {
      console.error(`  ERROR on ${spec.table}:`, err);
      // Continue with next table
    }
  }

  console.log("\n=== Summary ===");
  console.log(`Total rows scanned: ${grandTotal}`);
  console.log(`Fields encrypted:   ${grandEncrypted}`);
  console.log(`Fields skipped:     ${grandSkipped} (already encrypted)`);
  if (DRY_RUN) {
    console.log("\nThis was a dry run. Re-run without --dry-run to apply.");
  }
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
