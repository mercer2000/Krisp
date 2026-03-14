# Account Settings Page Redesign

## Overview

Redesign `/settings/account` from a delete-only page into a full account settings page with profile information, work schedule, and a danger zone linking to a dedicated delete page.

## Architecture

Single scrollable page at `/settings/account` with three sections stacked vertically:
1. Profile Information (top)
2. Work Schedule (middle)
3. Danger Zone (bottom)

Delete confirmation moves to its own sub-page at `/settings/account/delete`.

## Data Loading

The server component (`page.tsx`) calls `getRequiredUser()` to get the user ID, then queries the `users` table for `displayName`, `email`, `phoneNumber`, `timezone`, and `workSchedule`. These are passed as props to `AccountSettingsClient`.

## Section 1: Profile Information

A form containing:
- **Name** — text input, editable, maps to `displayName` column
- **Email** — read-only display, sourced from the `users` table (populated during auto-sync on login)
- **Phone Number** — text input, new `phone_number` column, `varchar(30)`, nullable. Stored as entered (no format stripping). Will be used for SMS notifications in the future.
- **Timezone** — dropdown selector, new `timezone` column, `varchar(50)`, nullable. Stores IANA timezone string (e.g., `"America/New_York"`). Defaults to browser-detected timezone on first load (via `Intl.DateTimeFormat().resolvedOptions().timeZone`).
- **Save** button

On success, brief inline confirmation. On validation error, field-level error messages. Save button shows loading state while request is in flight.

## Section 2: Work Schedule

For each day of the week (Monday–Sunday):
- A toggle to mark the day as a work day or off
- When toggled on, one or more time blocks with start/end times
- "Add block" button for split schedules (e.g., morning + afternoon)
- Remove button on each block when more than one exists
- Own Save button, independent of profile save

Same save feedback pattern: inline confirmation on success, field-level errors on validation failure.

### Storage

New `work_schedule` JSONB column on `users` table, nullable.

```json
{
  "monday": [{ "start": "08:00", "end": "12:00" }, { "start": "13:00", "end": "17:00" }],
  "tuesday": [{ "start": "09:00", "end": "17:00" }],
  "wednesday": [],
  "thursday": [{ "start": "09:00", "end": "17:00" }],
  "friday": [{ "start": "09:00", "end": "15:00" }],
  "saturday": [],
  "sunday": []
}
```

- Empty array or absent key = non-work day
- Times stored in 24-hour `HH:MM` format
- Times are interpreted in the user's configured timezone

### Validation Rules

- Time format must be `HH:MM` (24-hour, zero-padded)
- `start` must be before `end` (no overnight blocks)
- Time blocks within a day must not overlap
- Maximum 5 blocks per day
- Only the 7 canonical day names are accepted as keys (`monday` through `sunday`)

## Section 3: Danger Zone

- Brief warning text
- Destructive-styled "Delete my data" button/link
- Navigates to `/settings/account/delete`

### Delete Page (`/settings/account/delete`)

The existing `DeleteAccountDataClient` component (at `app/(app)/admin/account/DeleteAccountDataClient.tsx`) is imported from the new delete page. The component stays at its current location — no file move. No changes to the delete logic.

## Schema Changes

Migration adds three nullable columns to `users`:

```sql
ALTER TABLE users ADD COLUMN phone_number varchar(30);
ALTER TABLE users ADD COLUMN timezone varchar(50);
ALTER TABLE users ADD COLUMN work_schedule jsonb;
```

No new RLS policies needed — existing `crudPolicy` on users table covers read/update for own row.

## API Changes

### New: `PUT /api/settings/profile`

Uses `PUT` to match existing settings routes (`/api/settings/default-board`, `/api/settings/email-action-board`).

- **Auth:** `auth.getSession()` with manual 401 check + plain `db` import with `eq(users.id, userId)` filtering — matches existing settings route pattern. (`getRequiredUser()` is only used in page server components, not API routes.)
- **Body:** `{ displayName?: string, phoneNumber?: string, timezone?: string, workSchedule?: object }`
- **Partial update semantics:** Only fields present in the request body are updated. Omitted fields are left unchanged. This allows the profile and work schedule Save buttons to independently update their respective fields.
- **Validation:**
  - `displayName`: max 100 chars, non-empty if provided
  - `phoneNumber`: max 30 chars
  - `timezone`: must be a valid IANA timezone string (validated via `Intl.supportedValuesOf('timeZone')`)
  - `workSchedule`: must conform to validation rules above
- **Side effect:** Sets `updatedAt` to current timestamp on successful update
- **Response:** Updated user fields

### No changes to `GET /api/auth/me`

The account page loads user data server-side via props — no need to expand `/api/auth/me`. After a successful save, the client updates local state from the PUT response rather than refetching.

## File Changes

| File | Change |
|------|--------|
| `lib/db/schema.ts` | Add `phoneNumber`, `timezone`, and `workSchedule` columns to users table |
| `drizzle/migrations/0054_*.sql` | New migration for schema changes |
| `app/(app)/settings/account/page.tsx` | Rewrite: query user data, pass as props to client component |
| `app/(app)/settings/account/AccountSettingsClient.tsx` | New client component for profile form + work schedule + danger zone link |
| `app/(app)/settings/account/delete/page.tsx` | New page importing the existing `DeleteAccountDataClient` from `app/(app)/admin/account/` |
| `app/api/settings/profile/route.ts` | New PUT endpoint for profile + work schedule updates |
| `app/api/auth/me/route.ts` | No changes needed |

## Component Structure

```
page.tsx (server) — queries user data from DB
  └── AccountSettingsClient.tsx (client)
        ├── Profile form (name, email read-only, phone, timezone)
        ├── Work schedule editor
        │     └── DaySchedule × 7 (toggle + time blocks)
        └── Danger zone (link to /settings/account/delete)

delete/page.tsx (server)
  └── DeleteAccountDataClient.tsx (imported from app/(app)/admin/account/)
```
