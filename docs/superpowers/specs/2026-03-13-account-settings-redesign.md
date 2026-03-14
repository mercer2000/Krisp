# Account Settings Page Redesign

## Overview

Redesign `/settings/account` from a delete-only page into a full account settings page with profile information, work schedule, and a danger zone linking to a dedicated delete page.

## Architecture

Single scrollable page at `/settings/account` with three sections stacked vertically:
1. Profile Information (top)
2. Work Schedule (middle)
3. Danger Zone (bottom)

Delete confirmation moves to its own sub-page at `/settings/account/delete`.

## Section 1: Profile Information

A form containing:
- **Name** — text input, editable, maps to `displayName` column
- **Email** — read-only display, sourced from auth provider (Neon Auth)
- **Phone Number** — text input, new `phone_number` column, `varchar(20)`, nullable. Will be used for SMS notifications in the future.
- **Save** button that PATCHes `/api/settings/profile`

## Section 2: Work Schedule

For each day of the week (Monday–Sunday):
- A toggle to mark the day as a work day or off
- When toggled on, one or more time blocks with start/end times
- "Add block" button for split schedules (e.g., morning + afternoon)
- Remove button on each block when more than one exists

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
- Times stored in 24-hour format as strings
- Own Save button, independent of profile save

## Section 3: Danger Zone

- Brief warning text
- Destructive-styled "Delete my data" button/link
- Navigates to `/settings/account/delete`

### Delete Page (`/settings/account/delete`)

The existing `DeleteAccountDataClient` component relocated to its own route. Same selective category-based deletion with confirmation phrase ("DELETE MY DATA"). No changes to the delete logic.

## Schema Changes

Migration adds two nullable columns to `users`:

```sql
ALTER TABLE users ADD COLUMN phone_number varchar(20);
ALTER TABLE users ADD COLUMN work_schedule jsonb;
```

No new RLS policies needed — existing `crudPolicy` on users table covers read/update for own row.

## API Changes

### New: `PATCH /api/settings/profile`

- **Auth:** `getRequiredUser()` + `getAuthDb()`
- **Body:** `{ displayName?: string, phoneNumber?: string, workSchedule?: object }`
- **Validation:**
  - `displayName`: max 100 chars, non-empty if provided
  - `phoneNumber`: max 20 chars
  - `workSchedule`: valid structure (object with day keys, arrays of `{start, end}` time strings)
- **Response:** Updated user fields

### Modified: `GET /api/auth/me`

Expand response to include `displayName`, `email`, `phoneNumber`, and `workSchedule` in addition to existing `role` field.

## File Changes

| File | Change |
|------|--------|
| `lib/db/schema.ts` | Add `phoneNumber` and `workSchedule` columns to users table |
| `drizzle/migrations/0054_*.sql` | New migration for schema changes |
| `app/(app)/settings/account/page.tsx` | Rewrite to render profile form, work schedule, and danger zone link |
| `app/(app)/settings/account/AccountSettingsClient.tsx` | New client component for the forms |
| `app/(app)/settings/account/delete/page.tsx` | New page rendering the existing `DeleteAccountDataClient` |
| `app/api/settings/profile/route.ts` | New PATCH endpoint for profile + work schedule |
| `app/api/auth/me/route.ts` | Expand GET response with profile fields |

## Component Structure

```
page.tsx (server)
  └── AccountSettingsClient.tsx (client)
        ├── Profile form (name, email read-only, phone)
        ├── Work schedule editor
        │     └── DaySchedule × 7 (toggle + time blocks)
        └── Danger zone (link to /settings/account/delete)

delete/page.tsx (server)
  └── DeleteAccountDataClient.tsx (existing, relocated)
```
