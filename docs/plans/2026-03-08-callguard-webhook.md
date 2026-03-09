# CallGuard Webhook Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Enable CallGuard desktop app to authenticate via MyOpenBrain and POST transcription data via JWT-authenticated webhook.

**Architecture:** Desktop app authenticates via WebView login flow, receives JWT from a callback route handler. Transcript webhook validates JWT independently using JWKS, then stores data in a dedicated `transcripts` table with RLS.

**Tech Stack:** Next.js route handlers, `jose` (JWT/JWKS), Drizzle ORM, Neon PostgreSQL with RLS

---

### Task 1: Install jose dependency

**Files:**
- Modify: `package.json`

**Step 1: Install jose**

Run: `npm install jose`

**Step 2: Verify installation**

Run: `npm ls jose`
Expected: `jose@<version>` listed

**Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add jose for JWT verification"
```

---

### Task 2: Add transcripts table to schema

**Files:**
- Modify: `lib/db/schema.ts` (append before the final admin_action_logs table, around line 2116)

**Step 1: Add the transcripts table definition**

Add to `lib/db/schema.ts` before the `adminActionLogs` table:

```typescript
// ── Transcripts (CallGuard) ──────────────────────────
export const transcripts = pgTable(
  "transcripts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    recordingId: text("recording_id"),
    application: text("application"),
    startTimeUtc: timestamp("start_time_utc", { withTimezone: true }),
    endTimeUtc: timestamp("end_time_utc", { withTimezone: true }),
    duration: text("duration"),
    modelName: text("model_name"),
    language: text("language"),
    fullText: text("full_text"),
    segments: jsonb("segments"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("idx_transcripts_user").on(table.userId),
    index("idx_transcripts_recording").on(table.recordingId),
    crudPolicy({
      role: authenticatedRole,
      read: authUid(table.userId),
      modify: authUid(table.userId),
    }),
  ]
);
```

**Step 2: Commit**

```bash
git add lib/db/schema.ts
git commit -m "feat: add transcripts table schema for CallGuard"
```

---

### Task 3: Create database migration

**Files:**
- Create: `drizzle/migrations/0041_callguard-transcripts.sql`

**Step 1: Write the migration SQL**

Create `drizzle/migrations/0041_callguard-transcripts.sql`:

```sql
CREATE TABLE transcripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recording_id TEXT,
  application TEXT,
  start_time_utc TIMESTAMPTZ,
  end_time_utc TIMESTAMPTZ,
  duration TEXT,
  model_name TEXT,
  language TEXT,
  full_text TEXT,
  segments JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_transcripts_user ON transcripts (user_id);
CREATE INDEX idx_transcripts_recording ON transcripts (recording_id);

-- RLS policies
ALTER TABLE transcripts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "transcripts_select_policy" ON transcripts
  FOR SELECT TO authenticated
  USING (auth.user_id()::uuid = user_id);

CREATE POLICY "transcripts_insert_policy" ON transcripts
  FOR INSERT TO authenticated
  WITH CHECK (auth.user_id()::uuid = user_id);

CREATE POLICY "transcripts_update_policy" ON transcripts
  FOR UPDATE TO authenticated
  USING (auth.user_id()::uuid = user_id)
  WITH CHECK (auth.user_id()::uuid = user_id);

CREATE POLICY "transcripts_delete_policy" ON transcripts
  FOR DELETE TO authenticated
  USING (auth.user_id()::uuid = user_id);
```

**Step 2: Commit**

```bash
git add drizzle/migrations/0041_callguard-transcripts.sql
git commit -m "feat: add transcripts migration with RLS policies"
```

---

### Task 4: Create callback-desktop route handler

**Files:**
- Create: `app/auth/callback-desktop/route.ts`

**Step 1: Create the route handler**

Create `app/auth/callback-desktop/route.ts`:

```typescript
import { auth } from "@/lib/auth/server";
import { NextResponse } from "next/server";

export async function GET() {
  const { data: session } = await auth.getSession();

  if (!session?.user?.id || !session?.session?.token) {
    return NextResponse.json(
      { error: "Not authenticated" },
      { status: 401 }
    );
  }

  return NextResponse.json({
    access_token: session.session.token,
    user: {
      id: session.user.id,
      email: session.user.email,
    },
  });
}
```

**Step 2: Commit**

```bash
git add app/auth/callback-desktop/route.ts
git commit -m "feat: add desktop callback route for CallGuard auth"
```

---

### Task 5: Create transcript webhook endpoint

**Files:**
- Create: `app/api/webhooks/transcript/route.ts`

**Step 1: Create the webhook route**

Create `app/api/webhooks/transcript/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { db } from "@/lib/db";
import { transcripts, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const NEON_AUTH_BASE_URL = process.env.NEON_AUTH_BASE_URL!;

// Cache the JWKS (jose handles caching internally)
const jwks = createRemoteJWKSet(
  new URL(`${NEON_AUTH_BASE_URL}/.well-known/jwks.json`)
);

/**
 * Extracts and verifies a Bearer JWT token from the Authorization header.
 * Returns the user ID (sub claim) or null if invalid.
 */
async function verifyBearerToken(
  request: NextRequest
): Promise<string | null> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const token = authHeader.slice(7);
  try {
    const { payload } = await jwtVerify(token, jwks);
    return (payload.sub as string) ?? null;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify JWT and extract user ID
    const userId = await verifyBearerToken(request);
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Verify user exists in our database
    const [user] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, userId));

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 401 }
      );
    }

    // Parse and validate payload
    const body = await request.json();

    if (!body.fullText && !body.segments) {
      return NextResponse.json(
        { error: "Missing required field: fullText or segments" },
        { status: 400 }
      );
    }

    // Insert transcript
    const [inserted] = await db
      .insert(transcripts)
      .values({
        userId,
        recordingId: body.recordingId ?? null,
        application: body.application ?? null,
        startTimeUtc: body.startTimeUtc ? new Date(body.startTimeUtc) : null,
        endTimeUtc: body.endTimeUtc ? new Date(body.endTimeUtc) : null,
        duration: body.duration ?? null,
        modelName: body.modelName ?? null,
        language: body.language ?? null,
        fullText: body.fullText ?? null,
        segments: body.segments ?? null,
      })
      .returning({ id: transcripts.id });

    return NextResponse.json({ id: inserted.id }, { status: 201 });
  } catch (error) {
    console.error("Error processing transcript webhook:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

**Step 2: Commit**

```bash
git add app/api/webhooks/transcript/route.ts
git commit -m "feat: add transcript webhook endpoint with JWT auth"
```

---

### Task 6: Run migration against database

**Step 1: Run the migration**

Run: `DATABASE_URL=<url> npx drizzle-kit push` or apply the SQL migration manually against the database.

Note: If using `drizzle-kit push`, verify it picks up the new `transcripts` table from the schema. If it generates extra DDL, use manual migration instead:

```bash
psql $DATABASE_URL -f drizzle/migrations/0041_callguard-transcripts.sql
```

**Step 2: Verify table exists**

Run a quick check that the table was created and RLS is enabled.

---

### Task 7: Manual smoke test

**Step 1: Test callback-desktop (requires active session)**

1. Log in at `http://localhost:3000/auth/sign-in`
2. Navigate to `http://localhost:3000/auth/callback-desktop`
3. Verify JSON response: `{ "access_token": "...", "user": { "id": "...", "email": "..." } }`

**Step 2: Test transcript webhook with the token**

```bash
curl -X POST http://localhost:3000/api/webhooks/transcript \
  -H "Authorization: Bearer <token_from_step_1>" \
  -H "Content-Type: application/json" \
  -d '{
    "recordingId": "test-001",
    "application": "Zoom",
    "startTimeUtc": "2026-03-08T10:00:00Z",
    "endTimeUtc": "2026-03-08T10:30:00Z",
    "duration": "00:30:00",
    "modelName": "base.en",
    "language": "en",
    "fullText": "Hello, this is a test transcript.",
    "segments": [{"start": "00:00:00", "end": "00:00:05", "text": "Hello, this is a test transcript."}]
  }'
```

Expected: `201` with `{ "id": "<uuid>" }`

**Step 3: Test unauthorized access**

```bash
curl -X POST http://localhost:3000/api/webhooks/transcript \
  -H "Authorization: Bearer invalid-token" \
  -H "Content-Type: application/json" \
  -d '{"fullText": "test"}'
```

Expected: `401` with `{ "error": "Unauthorized" }`
