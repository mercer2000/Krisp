# Image Upload & Storage Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Enable persistent image storage in the block editor so pasted/uploaded images survive navigation.

**Architecture:** Images are uploaded to Vercel Blob via a new `/api/upload` route. An `uploads` table tracks per-tenant storage for billing. The BlockEditor gets a paste handler that intercepts image files, uploads them, and creates image blocks with permanent URLs. A slash command "Image" option also allows file picker uploads.

**Tech Stack:** `@vercel/blob`, Drizzle ORM, Next.js API routes, contentEditable paste events

---

### Task 1: Install @vercel/blob

**Step 1: Install the package**

Run: `npm install @vercel/blob`

**Step 2: Add env var**

Add `BLOB_READ_WRITE_TOKEN` to `.env.local`. Get the token from the Vercel dashboard: Storage > Create Blob Store > copy the token.

**Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: install @vercel/blob for image uploads"
```

---

### Task 2: Add `uploads` table to schema

**Files:**
- Modify: `lib/db/schema.ts` (append after line ~2412)
- Create: `drizzle/migrations/0052_image-uploads.sql`

**Step 1: Add the table definition to schema.ts**

Append to end of `lib/db/schema.ts`:

```typescript
// ── Uploads (image/file storage tracking) ────────────
export const uploads = pgTable(
  "uploads",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    filename: varchar("filename", { length: 512 }).notNull(),
    contentType: varchar("content_type", { length: 100 }).notNull(),
    sizeBytes: integer("size_bytes").notNull(),
    blobUrl: text("blob_url").notNull(),
    source: varchar("source", { length: 50 }).notNull(), // "page_block", "card", etc.
    sourceId: varchar("source_id", { length: 255 }), // block ID, card ID, etc.
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("idx_uploads_tenant").on(table.tenantId),
    crudPolicy({
      role: authenticatedRole,
      read: authUid(table.tenantId),
      modify: authUid(table.tenantId),
    }),
  ]
);
```

**Step 2: Create migration file**

Create `drizzle/migrations/0052_image-uploads.sql`:

```sql
CREATE TABLE "uploads" (
  "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  "tenant_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "filename" varchar(512) NOT NULL,
  "content_type" varchar(100) NOT NULL,
  "size_bytes" integer NOT NULL,
  "blob_url" text NOT NULL,
  "source" varchar(50) NOT NULL,
  "source_id" varchar(255),
  "created_at" timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX "idx_uploads_tenant" ON "uploads" ("tenant_id");

ALTER TABLE "uploads" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "uploads_crud_read" ON "uploads"
  FOR SELECT TO "authenticated"
  USING ((select auth.user_id()::uuid = tenant_id));

CREATE POLICY "uploads_crud_insert" ON "uploads"
  FOR INSERT TO "authenticated"
  WITH CHECK ((select auth.user_id()::uuid = tenant_id));

CREATE POLICY "uploads_crud_update" ON "uploads"
  FOR UPDATE TO "authenticated"
  USING ((select auth.user_id()::uuid = tenant_id));

CREATE POLICY "uploads_crud_delete" ON "uploads"
  FOR DELETE TO "authenticated"
  USING ((select auth.user_id()::uuid = tenant_id));
```

**Step 3: Run migration**

Run: `DATABASE_URL="<your-db-url>" npx drizzle-kit push`

**Step 4: Commit**

```bash
git add lib/db/schema.ts drizzle/migrations/0052_image-uploads.sql
git commit -m "feat: add uploads table for image storage tracking"
```

---

### Task 3: Create upload API route

**Files:**
- Create: `app/api/upload/route.ts`

**Step 1: Create the upload endpoint**

Create `app/api/upload/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { getRequiredUser } from "@/lib/auth/getRequiredUser";
import { db } from "@/lib/db";
import { uploads } from "@/lib/db/schema";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/gif", "image/webp", "image/svg+xml"];

export async function POST(request: NextRequest) {
  try {
    const user = await getRequiredUser();

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const source = (formData.get("source") as string) || "page_block";
    const sourceId = (formData.get("sourceId") as string) || null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "File type not allowed. Accepted: PNG, JPEG, GIF, WebP, SVG." },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 5MB." },
        { status: 400 }
      );
    }

    // Upload to Vercel Blob
    const blob = await put(`uploads/${user.id}/${Date.now()}-${file.name}`, file, {
      access: "public",
      contentType: file.type,
    });

    // Track in database
    const [upload] = await db
      .insert(uploads)
      .values({
        tenantId: user.id,
        filename: file.name,
        contentType: file.type,
        sizeBytes: file.size,
        blobUrl: blob.url,
        source,
        sourceId,
      })
      .returning();

    return NextResponse.json({ url: blob.url, id: upload.id });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
```

**Step 2: Commit**

```bash
git add app/api/upload/route.ts
git commit -m "feat: add image upload API route with Vercel Blob"
```

---

### Task 4: Create storage usage API route

**Files:**
- Create: `app/api/storage/usage/route.ts`

**Step 1: Create the usage endpoint**

Create `app/api/storage/usage/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { getRequiredUser } from "@/lib/auth/getRequiredUser";
import { db } from "@/lib/db";
import { uploads } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";

export async function GET() {
  try {
    const user = await getRequiredUser();

    const [result] = await db
      .select({
        totalBytes: sql<number>`coalesce(sum(${uploads.sizeBytes}), 0)`,
        fileCount: sql<number>`count(*)`,
      })
      .from(uploads)
      .where(eq(uploads.tenantId, user.id));

    return NextResponse.json({
      totalBytes: Number(result.totalBytes),
      fileCount: Number(result.fileCount),
      totalMB: Math.round(Number(result.totalBytes) / 1024 / 1024 * 100) / 100,
    });
  } catch (error) {
    console.error("Storage usage error:", error);
    return NextResponse.json({ error: "Failed to fetch usage" }, { status: 500 });
  }
}
```

**Step 2: Commit**

```bash
git add app/api/storage/usage/route.ts
git commit -m "feat: add storage usage API for billing tracking"
```

---

### Task 5: Add paste handler to BlockEditor

**Files:**
- Modify: `components/pages/editor/BlockEditor.tsx`

This is the core change. We need to:
1. Add a paste event handler on the editor container
2. When an image is pasted, upload it via `/api/upload`
3. Create an image block with the returned URL

**Step 1: Add the paste handler**

In `BlockEditor.tsx`, find the main editor container `<div>` and add an `onPaste` handler. The handler should be defined inside the `BlockEditor` component.

Add this function inside the `BlockEditor` component (before the JSX return):

```typescript
const handlePaste = useCallback(
  async (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (const item of Array.from(items)) {
      if (!item.type.startsWith("image/")) continue;

      e.preventDefault();
      const file = item.getAsFile();
      if (!file) continue;

      // Upload the image
      const formData = new FormData();
      formData.append("file", file);
      formData.append("source", "page_block");

      try {
        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          console.error("Image upload failed:", err.error || res.status);
          return;
        }

        const { url } = await res.json();

        // Create an image block after the currently focused block
        const rootBlocks = getRootBlocks(page.blocks);
        const lastSortOrder = rootBlocks.length > 0
          ? rootBlocks[rootBlocks.length - 1].sortOrder
          : 0;

        createBlock.mutate({
          type: "image",
          content: { url, caption: "" },
          sort_order: lastSortOrder + 1,
        });
      } catch (err) {
        console.error("Image paste error:", err);
      }
      return; // Only handle the first image
    }
  },
  [page.blocks, createBlock]
);
```

**Step 2: Attach the handler to the editor wrapper**

Find the outermost `<div>` wrapping the block list and add `onPaste={handlePaste}`.

**Step 3: Add `useCallback` to imports if not already there**

Check that `useCallback` is in the React import at the top of the file.

**Step 4: Commit**

```bash
git add components/pages/editor/BlockEditor.tsx
git commit -m "feat: add image paste handler to block editor"
```

---

### Task 6: Add "Image" to slash command menu

**Files:**
- Modify: `components/pages/editor/SlashCommandMenu.tsx`
- Modify: `components/pages/editor/BlockEditor.tsx`

**Step 1: Add Image option to SlashCommandMenu**

In `SlashCommandMenu.tsx`, add to the `SLASH_COMMANDS` array:

```typescript
{ type: "image", label: "Image", description: "Upload an image", icon: "🖼" },
```

**Step 2: Handle image type selection in BlockEditor**

When the slash command selects "image", open a file picker instead of creating an empty block. In BlockEditor, where the slash command `onSelect` is handled, add a special case for "image":

```typescript
// When slash command selects "image", open file picker
if (type === "image") {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*";
  input.onchange = async () => {
    const file = input.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("source", "page_block");

    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (!res.ok) return;
      const { url } = await res.json();

      createBlock.mutate({
        type: "image",
        content: { url, caption: "" },
        sort_order: afterSortOrder + 1,
      });
    } catch (err) {
      console.error("Image upload error:", err);
    }
  };
  input.click();
  return;
}
```

**Step 3: Add "image" to the BlockType type if not already there**

Check `types/index.ts` (or wherever `BlockType` is defined) and ensure "image" is included.

**Step 4: Commit**

```bash
git add components/pages/editor/SlashCommandMenu.tsx components/pages/editor/BlockEditor.tsx
git commit -m "feat: add Image slash command with file picker upload"
```

---

### Task 7: Final integration test and commit

**Step 1: Verify the full flow works**

1. Open a workspace page
2. Paste an image from clipboard — should upload and show as persistent image block
3. Navigate away and back — image should still be there
4. Use `/image` slash command — file picker should open, selected image uploads
5. Check `/api/storage/usage` returns correct byte count

**Step 2: Final commit**

```bash
git add -A
git commit -m "feat: complete image upload with Vercel Blob and storage tracking"
```
