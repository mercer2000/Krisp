import sql from "@/lib/krisp/db";
import {
  encrypt,
  decrypt,
  encryptNullable,
  decryptNullable,
  isEncrypted,
} from "@/lib/encryption";
import type { ContactListItem, ContactRecentEmail } from "@/types/contact";

// Only display_name is encrypted (email stored in plaintext lowercase for dedup)
const ENCRYPTED_COLS = ["display_name"] as const;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function decryptRow(row: any): any {
  const result = { ...row };
  for (const col of ENCRYPTED_COLS) {
    const val = result[col];
    if (typeof val === "string" && isEncrypted(val)) {
      result[col] = decrypt(val);
    }
  }
  return result;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function decryptRows(rows: any[]): any[] {
  return rows.map(decryptRow);
}

/**
 * Parse an email address string like "John Doe <john@example.com>" into parts.
 */
function parseEmailAddress(raw: string): { email: string; displayName: string | null } {
  const match = raw.match(/^(.+?)\s*<(.+?)>$/);
  if (match) {
    return { displayName: match[1].trim().replace(/^["']|["']$/g, ""), email: match[2].trim().toLowerCase() };
  }
  return { email: raw.trim().toLowerCase(), displayName: null };
}

/**
 * Extract and upsert contacts from a set of email addresses for a tenant.
 * Handles deduplication via ON CONFLICT on (tenant_id, email).
 * Email is stored in plaintext lowercase for dedup; display_name is encrypted.
 */
export async function upsertContacts(
  tenantId: string,
  addresses: string[],
  emailDate?: Date
): Promise<void> {
  const seen = new Set<string>();
  for (const addr of addresses) {
    const { email, displayName } = parseEmailAddress(addr);
    if (!email || seen.has(email)) continue;
    seen.add(email);

    const encName = encryptNullable(displayName);
    const dateStr = emailDate?.toISOString() ?? new Date().toISOString();

    await sql`
      INSERT INTO email_contacts (tenant_id, email, display_name, email_count, last_email_at, first_seen_at)
      VALUES (${tenantId}, ${email}, ${encName}, 1, ${dateStr}::timestamptz, ${dateStr}::timestamptz)
      ON CONFLICT (tenant_id, email)
      DO UPDATE SET
        email_count = email_contacts.email_count + 1,
        display_name = COALESCE(EXCLUDED.display_name, email_contacts.display_name),
        last_email_at = GREATEST(email_contacts.last_email_at, EXCLUDED.last_email_at),
        updated_at = NOW()
    `;
  }
}

/**
 * List contacts with pagination and search.
 * Email is plaintext so SQL ILIKE search works for email; display_name
 * is encrypted so we filter client-side after decryption.
 */
export async function listContacts(
  tenantId: string,
  opts: { page: number; limit: number; q?: string; sort?: string }
): Promise<{ rows: ContactListItem[]; total: number }> {
  const allRows = await sql`
    SELECT id, email, display_name, email_count, last_email_at, first_seen_at
    FROM email_contacts
    WHERE tenant_id = ${tenantId}
    ORDER BY email_count DESC, last_email_at DESC NULLS LAST
  `;

  let decrypted = decryptRows(allRows as Record<string, unknown>[]).map((row) => ({
    id: row.id as string,
    email: row.email as string,
    display_name: row.display_name as string | null,
    email_count: row.email_count as number,
    last_email_at: row.last_email_at as string | null,
    first_seen_at: row.first_seen_at as string,
  }));

  // Apply keyword filter on email and decrypted display_name
  if (opts.q) {
    const lower = opts.q.toLowerCase();
    decrypted = decrypted.filter(
      (r) =>
        r.email.toLowerCase().includes(lower) ||
        (r.display_name?.toLowerCase().includes(lower) ?? false)
    );
  }

  // Sort
  if (opts.sort === "name") {
    decrypted.sort((a, b) =>
      (a.display_name ?? a.email).localeCompare(b.display_name ?? b.email)
    );
  } else if (opts.sort === "recent") {
    decrypted.sort((a, b) => {
      const da = a.last_email_at ? new Date(a.last_email_at).getTime() : 0;
      const db_ = b.last_email_at ? new Date(b.last_email_at).getTime() : 0;
      return db_ - da;
    });
  }
  // Default sort: by email_count DESC (already from SQL)

  const total = decrypted.length;
  const offset = (opts.page - 1) * opts.limit;
  const paged = decrypted.slice(offset, offset + opts.limit);

  return { rows: paged, total };
}

/**
 * Get a single contact by ID.
 */
export async function getContactById(
  contactId: string,
  tenantId: string
): Promise<ContactListItem | null> {
  const rows = await sql`
    SELECT id, email, display_name, email_count, last_email_at, first_seen_at
    FROM email_contacts
    WHERE id = ${contactId}::uuid AND tenant_id = ${tenantId}
    LIMIT 1
  `;
  if (!rows[0]) return null;
  const r = decryptRow(rows[0]);
  return {
    id: r.id,
    email: r.email,
    display_name: r.display_name,
    email_count: r.email_count,
    last_email_at: r.last_email_at,
    first_seen_at: r.first_seen_at,
  };
}

/**
 * Get recent emails for a contact (searches both Outlook and Gmail tables).
 * Since sender/subject in emails are encrypted with random IVs, we fetch all
 * emails and filter in application code after decryption.
 */
export async function getRecentEmailsForContact(
  tenantId: string,
  contactEmail: string,
  limitCount: number = 10
): Promise<ContactRecentEmail[]> {
  // Search Outlook emails — recipients is JSONB, sender is encrypted
  // We search recipients with LIKE on the plaintext email in the JSON array,
  // then decrypt sender for comparison in app code
  const outlookRows = await sql`
    SELECT id, sender, subject, received_at
    FROM emails
    WHERE tenant_id = ${tenantId}
      AND deleted_at IS NULL
    ORDER BY received_at DESC
    LIMIT 200
  `;

  // Search Gmail emails
  const gmailRows = await sql`
    SELECT id, sender, subject, received_at
    FROM gmail_emails
    WHERE tenant_id = ${tenantId}
    ORDER BY received_at DESC
    LIMIT 200
  `;

  const lowerEmail = contactEmail.toLowerCase();
  const results: ContactRecentEmail[] = [];

  const decryptField = (val: unknown): string | null => {
    if (typeof val === "string" && isEncrypted(val)) return decrypt(val);
    return val as string | null;
  };

  for (const row of outlookRows) {
    const r = row as Record<string, unknown>;
    const sender = decryptField(r.sender) ?? "";
    // Check if this contact is the sender (parse to just email part)
    const { email: senderEmail } = parseEmailAddress(sender);
    if (senderEmail === lowerEmail) {
      results.push({
        id: r.id as number,
        subject: decryptField(r.subject),
        received_at: r.received_at as string,
        provider: "outlook",
      });
    }
  }

  for (const row of gmailRows) {
    const r = row as Record<string, unknown>;
    const sender = decryptField(r.sender) ?? "";
    const { email: senderEmail } = parseEmailAddress(sender);
    if (senderEmail === lowerEmail) {
      results.push({
        id: r.id as string,
        subject: decryptField(r.subject),
        received_at: r.received_at as string,
        provider: "gmail",
      });
    }
  }

  // Sort by date and limit
  results.sort((a, b) => new Date(b.received_at).getTime() - new Date(a.received_at).getTime());
  return results.slice(0, limitCount);
}

/**
 * Search contacts for autocomplete suggestions.
 * Email is plaintext, so we can filter with SQL ILIKE for efficiency.
 * Display_name is encrypted, so final filtering is done in app code.
 */
export async function searchContactsForAutocomplete(
  tenantId: string,
  query: string,
  limitCount: number = 10
): Promise<{ email: string; display_name: string | null }[]> {
  // First try SQL-side filter on email
  const allRows = await sql`
    SELECT email, display_name
    FROM email_contacts
    WHERE tenant_id = ${tenantId}
    ORDER BY email_count DESC
    LIMIT 500
  `;

  const lower = query.toLowerCase();
  return decryptRows(allRows as Record<string, unknown>[])
    .filter(
      (r) =>
        (r.email as string).toLowerCase().includes(lower) ||
        ((r.display_name as string | null)?.toLowerCase().includes(lower) ?? false)
    )
    .slice(0, limitCount)
    .map((r) => ({
      email: r.email as string,
      display_name: r.display_name as string | null,
    }));
}

/**
 * Scan all existing emails and build/refresh the contacts table.
 * This is an idempotent batch operation.
 */
export async function rebuildContactsFromEmails(tenantId: string): Promise<number> {
  // Gather all unique addresses from Outlook emails
  const outlookRows = await sql`
    SELECT sender, recipients, cc, bcc
    FROM emails
    WHERE tenant_id = ${tenantId} AND deleted_at IS NULL
  `;

  // Gather from Gmail emails
  const gmailRows = await sql`
    SELECT sender, recipients
    FROM gmail_emails
    WHERE tenant_id = ${tenantId}
  `;

  // Collect all addresses with their latest dates
  const addressMap = new Map<string, { displayName: string | null; count: number }>();

  const processAddress = (raw: string) => {
    if (!raw) return;
    // Decrypt if needed
    const dec = isEncrypted(raw) ? decrypt(raw) : raw;
    const { email, displayName } = parseEmailAddress(dec);
    if (!email) return;
    const existing = addressMap.get(email);
    if (existing) {
      existing.count++;
      if (displayName && !existing.displayName) {
        existing.displayName = displayName;
      }
    } else {
      addressMap.set(email, { displayName, count: 1 });
    }
  };

  for (const row of outlookRows) {
    const r = row as Record<string, unknown>;
    processAddress(r.sender as string);
    const recipients = r.recipients as string[];
    if (Array.isArray(recipients)) recipients.forEach(processAddress);
    const cc = r.cc as string[];
    if (Array.isArray(cc)) cc.forEach(processAddress);
    const bcc = r.bcc as string[];
    if (Array.isArray(bcc)) bcc.forEach(processAddress);
  }

  for (const row of gmailRows) {
    const r = row as Record<string, unknown>;
    processAddress(r.sender as string);
    const recipients = r.recipients as string[];
    if (Array.isArray(recipients)) recipients.forEach(processAddress);
  }

  // Upsert all contacts (email in plaintext lowercase, display_name encrypted)
  for (const [email, data] of addressMap) {
    const encName = encryptNullable(data.displayName);

    await sql`
      INSERT INTO email_contacts (tenant_id, email, display_name, email_count, last_email_at, first_seen_at)
      VALUES (${tenantId}, ${email}, ${encName}, ${data.count}, NOW(), NOW())
      ON CONFLICT (tenant_id, email)
      DO UPDATE SET
        email_count = ${data.count},
        display_name = COALESCE(EXCLUDED.display_name, email_contacts.display_name),
        updated_at = NOW()
    `;
  }

  return addressMap.size;
}

/**
 * Delete a contact by ID.
 */
export async function deleteContact(
  contactId: string,
  tenantId: string
): Promise<boolean> {
  const rows = await sql`
    DELETE FROM email_contacts
    WHERE id = ${contactId}::uuid AND tenant_id = ${tenantId}
    RETURNING id
  `;
  return rows.length > 0;
}
