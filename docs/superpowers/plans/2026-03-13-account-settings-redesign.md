# Account Settings Redesign Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign `/settings/account` into a full profile page with name, email (read-only), phone, timezone, work schedule, and a danger zone linking to a dedicated delete sub-page.

**Architecture:** Server component queries user data and passes as props to a single client component. Client component renders three sections: profile form, work schedule editor, and danger zone. Both forms PUT to `/api/settings/profile` with partial update semantics. Delete moves to `/settings/account/delete` sub-page.

**Tech Stack:** Next.js 16, React 19, Drizzle ORM, Neon PostgreSQL, CSS variables for styling

**Spec:** `docs/superpowers/specs/2026-03-13-account-settings-redesign.md`

---

## File Structure

| File | Action | Responsibility |
|------|--------|---------------|
| `lib/db/schema.ts` | Modify | Add `phoneNumber`, `timezone`, `workSchedule` columns to users table |
| `drizzle/migrations/0054_account-profile-fields.sql` | Create | Migration for new columns |
| `app/api/settings/profile/route.ts` | Create | PUT endpoint for profile + work schedule updates |
| `app/(app)/settings/account/page.tsx` | Modify | Rewrite to query user data, pass as props |
| `app/(app)/settings/account/AccountSettingsClient.tsx` | Create | Client component: profile form, work schedule, danger zone |
| `app/(app)/settings/account/delete/page.tsx` | Create | Delete sub-page importing existing `DeleteAccountDataClient` |

---

## Chunk 1: Schema & Migration

### Task 1: Add columns to users schema

**Files:**
- Modify: `lib/db/schema.ts:54-80`

- [ ] **Step 1: Add three new columns to the users table**

In `lib/db/schema.ts`, add these columns to the `users` table definition, after the `stripeCustomerId` line (line 66) and before the `role` line (line 67):

```typescript
  phoneNumber: varchar("phone_number", { length: 30 }),
  timezone: varchar("timezone", { length: 50 }),
  workSchedule: jsonb("work_schedule").$type<Record<string, { start: string; end: string }[]>>(),
```

- [ ] **Step 2: Commit**

```bash
git add lib/db/schema.ts
git commit -m "feat(schema): add phoneNumber, timezone, workSchedule to users table"
```

### Task 2: Create migration

**Files:**
- Create: `drizzle/migrations/0054_account-profile-fields.sql`

- [ ] **Step 1: Create the migration file**

```sql
ALTER TABLE "users" ADD COLUMN "phone_number" varchar(30);
ALTER TABLE "users" ADD COLUMN "timezone" varchar(50);
ALTER TABLE "users" ADD COLUMN "work_schedule" jsonb;
```

- [ ] **Step 2: Apply the migration**

This project uses manual migration files (not `drizzle-kit push`). Run the SQL directly against the database:

```bash
# Use psql or your preferred SQL client. The DATABASE_URL is in .env
psql "$DATABASE_URL" -f drizzle/migrations/0054_account-profile-fields.sql
```

Note: The migration journal at `drizzle/migrations/meta/_journal.json` is not maintained for manual migrations (0030+). No journal entry is needed.

- [ ] **Step 3: Commit**

```bash
git add drizzle/migrations/0054_account-profile-fields.sql
git commit -m "feat(migration): add profile fields to users table"
```

---

## Chunk 2: API Route

### Task 3: Create PUT /api/settings/profile

**Files:**
- Create: `app/api/settings/profile/route.ts`

This follows the exact pattern from `app/api/settings/default-board/route.ts`: `auth.getSession()` → 401 check → validate → `db.update(users).set(...)` → return updated fields.

- [ ] **Step 1: Create the route file**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const DAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

type TimeBlock = { start: string; end: string };
type WorkSchedule = Record<string, TimeBlock[]>;

function validateWorkSchedule(
  schedule: unknown
): string | null {
  if (typeof schedule !== "object" || schedule === null || Array.isArray(schedule)) {
    return "workSchedule must be an object";
  }

  const obj = schedule as Record<string, unknown>;

  for (const key of Object.keys(obj)) {
    if (!DAYS.includes(key as (typeof DAYS)[number])) {
      return `Invalid day: ${key}`;
    }

    const blocks = obj[key];
    if (!Array.isArray(blocks)) {
      return `${key} must be an array of time blocks`;
    }

    if (blocks.length > 5) {
      return `${key} has more than 5 time blocks`;
    }

    for (const block of blocks) {
      if (
        typeof block !== "object" ||
        block === null ||
        typeof block.start !== "string" ||
        typeof block.end !== "string"
      ) {
        return `${key} contains invalid time block`;
      }

      if (!TIME_RE.test(block.start) || !TIME_RE.test(block.end)) {
        return `${key} contains invalid time format (use HH:MM)`;
      }

      if (block.start >= block.end) {
        return `${key} has a block where start is not before end`;
      }
    }

    // Check for overlapping blocks
    const sorted = [...(blocks as TimeBlock[])].sort((a, b) =>
      a.start.localeCompare(b.start)
    );
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i].start < sorted[i - 1].end) {
        return `${key} has overlapping time blocks`;
      }
    }
  }

  return null;
}

export async function PUT(request: NextRequest) {
  try {
    const { data: session } = await auth.getSession();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const updates: Record<string, unknown> = {};
    const errors: Record<string, string> = {};

    // displayName
    if ("displayName" in body) {
      const name = body.displayName;
      if (typeof name !== "string" || name.trim().length === 0) {
        errors.displayName = "Name is required";
      } else if (name.length > 100) {
        errors.displayName = "Name must be 100 characters or less";
      } else {
        updates.displayName = name.trim();
      }
    }

    // phoneNumber
    if ("phoneNumber" in body) {
      const phone = body.phoneNumber;
      if (phone !== null && phone !== "") {
        if (typeof phone !== "string" || phone.length > 30) {
          errors.phoneNumber = "Phone number must be 30 characters or less";
        } else {
          updates.phoneNumber = phone;
        }
      } else {
        updates.phoneNumber = null;
      }
    }

    // timezone
    if ("timezone" in body) {
      const tz = body.timezone;
      if (tz !== null && tz !== "") {
        const valid = Intl.supportedValuesOf("timeZone");
        if (!valid.includes(tz)) {
          errors.timezone = "Invalid timezone";
        } else {
          updates.timezone = tz;
        }
      } else {
        updates.timezone = null;
      }
    }

    // workSchedule
    if ("workSchedule" in body) {
      const schedule = body.workSchedule;
      if (schedule === null) {
        updates.workSchedule = null;
      } else {
        const err = validateWorkSchedule(schedule);
        if (err) {
          errors.workSchedule = err;
        } else {
          updates.workSchedule = schedule;
        }
      }
    }

    if (Object.keys(errors).length > 0) {
      return NextResponse.json({ errors }, { status: 400 });
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    updates.updatedAt = new Date();

    const [updated] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, userId))
      .returning({
        displayName: users.displayName,
        phoneNumber: users.phoneNumber,
        timezone: users.timezone,
        workSchedule: users.workSchedule,
      });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 2: Verify the route works**

Start the dev server and test with curl or the browser console:
```bash
# From browser console while logged in:
fetch("/api/settings/profile", {
  method: "PUT",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ displayName: "Test Name" })
}).then(r => r.json()).then(console.log)
```

- [ ] **Step 3: Commit**

```bash
git add app/api/settings/profile/route.ts
git commit -m "feat: add PUT /api/settings/profile endpoint"
```

---

## Chunk 3: Delete Sub-Page

### Task 4: Create delete sub-page

**Files:**
- Create: `app/(app)/settings/account/delete/page.tsx`

- [ ] **Step 1: Create the delete page**

This page imports the existing `DeleteAccountDataClient` from `app/(app)/admin/account/`. No changes to that component.

```typescript
import { getRequiredUser } from "@/lib/auth/getRequiredUser";
import { DeleteAccountDataClient } from "@/app/(app)/admin/account/DeleteAccountDataClient";

export default async function DeleteAccountDataPage() {
  await getRequiredUser();

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="mb-1 text-2xl font-bold text-[var(--foreground)]">
        Delete Account Data
      </h1>
      <p className="mb-8 text-sm text-[var(--muted-foreground)]">
        Selectively delete your data. This action cannot be undone.
      </p>

      <DeleteAccountDataClient />
    </div>
  );
}
```

- [ ] **Step 2: Verify the page renders at /settings/account/delete**

Navigate to `http://localhost:3000/settings/account/delete` and confirm the existing delete UI appears.

- [ ] **Step 3: Commit**

```bash
git add "app/(app)/settings/account/delete/page.tsx"
git commit -m "feat: add /settings/account/delete sub-page"
```

---

## Chunk 4: Account Page & Client Component

### Task 5: Rewrite the account settings server page

**Files:**
- Modify: `app/(app)/settings/account/page.tsx`

- [ ] **Step 1: Rewrite page.tsx to query user data and pass as props**

```typescript
import { getRequiredUser } from "@/lib/auth/getRequiredUser";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { AccountSettingsClient } from "./AccountSettingsClient";

export default async function SettingsAccountPage() {
  const { id } = await getRequiredUser();

  const [user] = await db
    .select({
      displayName: users.displayName,
      email: users.email,
      phoneNumber: users.phoneNumber,
      timezone: users.timezone,
      workSchedule: users.workSchedule,
    })
    .from(users)
    .where(eq(users.id, id));

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="mb-1 text-2xl font-bold text-[var(--foreground)]">
        Account
      </h1>
      <p className="mb-8 text-sm text-[var(--muted-foreground)]">
        Manage your profile, work schedule, and account data.
      </p>

      <AccountSettingsClient
        initialData={{
          displayName: user?.displayName ?? "",
          email: user?.email ?? "",
          phoneNumber: user?.phoneNumber ?? "",
          timezone: user?.timezone ?? "",
          workSchedule: user?.workSchedule ?? null,
        }}
      />
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add "app/(app)/settings/account/page.tsx"
git commit -m "feat: rewrite account page to load user data as props"
```

### Task 6: Create the AccountSettingsClient component

**Files:**
- Create: `app/(app)/settings/account/AccountSettingsClient.tsx`

This is the main client component with three sections. It follows the same patterns as `DeleteAccountDataClient`: `"use client"`, `useState` for form state, `fetch()` for API calls, CSS variables for styling.

- [ ] **Step 1: Create the client component**

```tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const DAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

const DAY_LABELS: Record<string, string> = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
  sunday: "Sunday",
};

type TimeBlock = { start: string; end: string };
type WorkSchedule = Record<string, TimeBlock[]>;

interface AccountSettingsProps {
  initialData: {
    displayName: string;
    email: string;
    phoneNumber: string;
    timezone: string;
    workSchedule: WorkSchedule | null;
  };
}

function getDefaultSchedule(): WorkSchedule {
  const schedule: WorkSchedule = {};
  for (const day of DAYS) {
    schedule[day] = [];
  }
  return schedule;
}

// Generate time options in 30-minute increments for select dropdowns
function getTimeOptions(): string[] {
  const options: string[] = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 30) {
      options.push(
        `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`
      );
    }
  }
  return options;
}

function formatTime(time: string): string {
  const [h, m] = time.split(":");
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const display = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${display}:${m} ${ampm}`;
}

const TIME_OPTIONS = getTimeOptions();

export function AccountSettingsClient({ initialData }: AccountSettingsProps) {
  // ── Profile state ──
  const [displayName, setDisplayName] = useState(initialData.displayName);
  const [phoneNumber, setPhoneNumber] = useState(initialData.phoneNumber);
  const [timezone, setTimezone] = useState(
    initialData.timezone ||
      Intl.DateTimeFormat().resolvedOptions().timeZone
  );
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileErrors, setProfileErrors] = useState<Record<string, string>>(
    {}
  );

  // ── Work schedule state ──
  const [schedule, setSchedule] = useState<WorkSchedule>(
    initialData.workSchedule ?? getDefaultSchedule()
  );
  const [scheduleSaving, setScheduleSaving] = useState(false);
  const [scheduleSuccess, setScheduleSuccess] = useState(false);
  const [scheduleErrors, setScheduleErrors] = useState<Record<string, string>>(
    {}
  );

  // ── Timezone options ──
  const [timezones, setTimezones] = useState<string[]>([]);
  useEffect(() => {
    try {
      setTimezones(Intl.supportedValuesOf("timeZone"));
    } catch {
      setTimezones([Intl.DateTimeFormat().resolvedOptions().timeZone]);
    }
  }, []);

  // Clear success messages after 3 seconds
  useEffect(() => {
    if (profileSuccess) {
      const t = setTimeout(() => setProfileSuccess(false), 3000);
      return () => clearTimeout(t);
    }
  }, [profileSuccess]);
  useEffect(() => {
    if (scheduleSuccess) {
      const t = setTimeout(() => setScheduleSuccess(false), 3000);
      return () => clearTimeout(t);
    }
  }, [scheduleSuccess]);

  // ── Profile save ──
  async function saveProfile() {
    setProfileSaving(true);
    setProfileErrors({});
    setProfileSuccess(false);
    try {
      const res = await fetch("/api/settings/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName,
          phoneNumber: phoneNumber || null,
          timezone,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.errors) {
          setProfileErrors(data.errors);
        } else {
          setProfileErrors({ _form: data.error || "Failed to save" });
        }
        return;
      }
      setDisplayName(data.displayName);
      setPhoneNumber(data.phoneNumber ?? "");
      setTimezone(data.timezone ?? "");
      setProfileSuccess(true);
    } catch {
      setProfileErrors({ _form: "Network error" });
    } finally {
      setProfileSaving(false);
    }
  }

  // ── Schedule save ──
  async function saveSchedule() {
    setScheduleSaving(true);
    setScheduleErrors({});
    setScheduleSuccess(false);
    try {
      const res = await fetch("/api/settings/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workSchedule: schedule }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.errors) {
          setScheduleErrors(data.errors);
        } else {
          setScheduleErrors({ _form: data.error || "Failed to save" });
        }
        return;
      }
      setSchedule(data.workSchedule ?? getDefaultSchedule());
      setScheduleSuccess(true);
    } catch {
      setScheduleErrors({ _form: "Network error" });
    } finally {
      setScheduleSaving(false);
    }
  }

  // ── Schedule helpers ──
  function toggleDay(day: string) {
    setSchedule((prev) => ({
      ...prev,
      [day]:
        prev[day]?.length > 0 ? [] : [{ start: "09:00", end: "17:00" }],
    }));
  }

  function updateBlock(day: string, index: number, field: "start" | "end", value: string) {
    setSchedule((prev) => ({
      ...prev,
      [day]: prev[day].map((b, i) =>
        i === index ? { ...b, [field]: value } : b
      ),
    }));
  }

  function addBlock(day: string) {
    setSchedule((prev) => {
      const blocks = prev[day] ?? [];
      if (blocks.length >= 5) return prev;
      const lastEnd = blocks.length > 0 ? blocks[blocks.length - 1].end : "09:00";
      return {
        ...prev,
        [day]: [...blocks, { start: lastEnd, end: "17:00" }],
      };
    });
  }

  function removeBlock(day: string, index: number) {
    setSchedule((prev) => ({
      ...prev,
      [day]: prev[day].filter((_, i) => i !== index),
    }));
  }

  return (
    <div className="space-y-10">
      {/* ── Profile Information ── */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-[var(--foreground)]">
          Profile Information
        </h2>
        <div className="space-y-4">
          {/* Name */}
          <div>
            <label
              htmlFor="displayName"
              className="mb-1 block text-sm font-medium text-[var(--foreground)]"
            >
              Name
            </label>
            <input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={100}
              className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]"
            />
            {profileErrors.displayName && (
              <p className="mt-1 text-sm text-red-500">
                {profileErrors.displayName}
              </p>
            )}
          </div>

          {/* Email (read-only) */}
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">
              Email
            </label>
            <p className="rounded-md border border-[var(--border)] bg-[var(--muted)] px-3 py-2 text-sm text-[var(--muted-foreground)]">
              {initialData.email}
            </p>
          </div>

          {/* Phone Number */}
          <div>
            <label
              htmlFor="phoneNumber"
              className="mb-1 block text-sm font-medium text-[var(--foreground)]"
            >
              Phone Number
            </label>
            <input
              id="phoneNumber"
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              maxLength={30}
              placeholder="+1 (555) 123-4567"
              className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]"
            />
            {profileErrors.phoneNumber && (
              <p className="mt-1 text-sm text-red-500">
                {profileErrors.phoneNumber}
              </p>
            )}
          </div>

          {/* Timezone */}
          <div>
            <label
              htmlFor="timezone"
              className="mb-1 block text-sm font-medium text-[var(--foreground)]"
            >
              Timezone
            </label>
            <select
              id="timezone"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]"
            >
              {timezones.map((tz) => (
                <option key={tz} value={tz}>
                  {tz.replace(/_/g, " ")}
                </option>
              ))}
            </select>
            {profileErrors.timezone && (
              <p className="mt-1 text-sm text-red-500">
                {profileErrors.timezone}
              </p>
            )}
          </div>

          {/* Save + feedback */}
          <div className="flex items-center gap-3">
            <button
              onClick={saveProfile}
              disabled={profileSaving}
              className="rounded-md bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)] hover:opacity-90 disabled:opacity-50"
            >
              {profileSaving ? "Saving..." : "Save"}
            </button>
            {profileSuccess && (
              <span className="text-sm text-green-600">Saved</span>
            )}
            {profileErrors._form && (
              <span className="text-sm text-red-500">
                {profileErrors._form}
              </span>
            )}
          </div>
        </div>
      </section>

      {/* ── Work Schedule ── */}
      <section>
        <h2 className="mb-1 text-lg font-semibold text-[var(--foreground)]">
          Work Schedule
        </h2>
        <p className="mb-4 text-sm text-[var(--muted-foreground)]">
          Set your working days and hours.
        </p>
        <div className="space-y-3">
          {DAYS.map((day) => {
            const blocks = schedule[day] ?? [];
            const isActive = blocks.length > 0;

            return (
              <div
                key={day}
                className="rounded-md border border-[var(--border)] p-3"
              >
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-3">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={isActive}
                      onClick={() => toggleDay(day)}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors ${
                        isActive
                          ? "bg-[var(--primary)]"
                          : "bg-[var(--muted)]"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                          isActive ? "translate-x-4" : "translate-x-0.5"
                        } mt-0.5`}
                      />
                    </button>
                    <span className="text-sm font-medium text-[var(--foreground)]">
                      {DAY_LABELS[day]}
                    </span>
                  </label>
                  {isActive && blocks.length < 5 && (
                    <button
                      type="button"
                      onClick={() => addBlock(day)}
                      className="text-xs text-[var(--primary)] hover:underline"
                    >
                      + Add block
                    </button>
                  )}
                </div>

                {isActive && (
                  <div className="mt-2 space-y-2 pl-12">
                    {blocks.map((block, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <select
                          value={block.start}
                          onChange={(e) =>
                            updateBlock(day, i, "start", e.target.value)
                          }
                          className="rounded-md border border-[var(--border)] bg-[var(--background)] px-2 py-1 text-sm text-[var(--foreground)]"
                        >
                          {TIME_OPTIONS.map((t) => (
                            <option key={t} value={t}>
                              {formatTime(t)}
                            </option>
                          ))}
                        </select>
                        <span className="text-sm text-[var(--muted-foreground)]">
                          to
                        </span>
                        <select
                          value={block.end}
                          onChange={(e) =>
                            updateBlock(day, i, "end", e.target.value)
                          }
                          className="rounded-md border border-[var(--border)] bg-[var(--background)] px-2 py-1 text-sm text-[var(--foreground)]"
                        >
                          {TIME_OPTIONS.map((t) => (
                            <option key={t} value={t}>
                              {formatTime(t)}
                            </option>
                          ))}
                        </select>
                        {blocks.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeBlock(day, i)}
                            className="text-xs text-red-500 hover:underline"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Save + feedback */}
        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={saveSchedule}
            disabled={scheduleSaving}
            className="rounded-md bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)] hover:opacity-90 disabled:opacity-50"
          >
            {scheduleSaving ? "Saving..." : "Save Schedule"}
          </button>
          {scheduleSuccess && (
            <span className="text-sm text-green-600">Saved</span>
          )}
          {scheduleErrors._form && (
            <span className="text-sm text-red-500">
              {scheduleErrors._form}
            </span>
          )}
          {scheduleErrors.workSchedule && (
            <span className="text-sm text-red-500">
              {scheduleErrors.workSchedule}
            </span>
          )}
        </div>
      </section>

      {/* ── Danger Zone ── */}
      <section className="border-t border-[var(--border)] pt-8">
        <h2 className="mb-1 text-lg font-semibold text-red-600">
          Danger Zone
        </h2>
        <p className="mb-4 text-sm text-[var(--muted-foreground)]">
          Permanently delete your account data. This action cannot be undone.
        </p>
        <Link
          href="/settings/account/delete"
          className="inline-block rounded-md border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-950"
        >
          Delete my data...
        </Link>
      </section>
    </div>
  );
}
```

- [ ] **Step 2: Verify the page renders at /settings/account**

Navigate to `http://localhost:3000/settings/account` and confirm:
- Profile form shows with name, email (read-only), phone, timezone
- Work schedule shows 7 days with toggles
- Danger zone shows at the bottom with link to delete page
- Profile Save works (updates name/phone/timezone)
- Schedule Save works (updates work schedule)
- Delete link navigates to `/settings/account/delete`

- [ ] **Step 3: Commit**

```bash
git add "app/(app)/settings/account/AccountSettingsClient.tsx" "app/(app)/settings/account/page.tsx"
git commit -m "feat: account settings page with profile, work schedule, and danger zone"
```
