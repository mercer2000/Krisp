# Brain Calendar Integration

## Summary

Add calendar events as a 6th data source to the Brain chat's context, enabling it to answer schedule-related questions like "What are my upcoming meetings?" using synced Outlook, Google Calendar, and Microsoft Graph events.

## Scope

**Single file change:** `app/api/brain/chat/route.ts`

No schema changes, no new files, no new API routes.

## Design

### Query Parameters

- **Date range:** Start of today (server-time, consistent with existing queries) through 30 days ahead
- **Max events:** 30
- **Filters:** `tenantId = userId`, `startDateTime >= startOfToday`, `isCancelled = false`
- **Sort:** `startDateTime ASC` (chronological order, earliest first)

### Selected Fields

- `subject` (encrypted)
- `startDateTime`
- `endDateTime`
- `isAllDay`
- `location` (encrypted)
- `organizerName`
- `attendees` (JSONB array of `{ email, name, response, type }` — extract only `name`, not emails)

### Context Format

```
## Calendar Events (N upcoming)
Event 1: "Team Standup" (Mar 14, 2026 9:00 AM - 9:30 AM)
Location: Zoom
Organizer: Jane Smith
Attendees: John, Sarah
---
Event 2: "Company Holiday" (Mar 15, 2026, All Day)
...
```

### Implementation Steps

1. Add `MAX_CONTEXT_CALENDAR_EVENTS = 30` constant
2. Import `calendarEvents` from schema, `CALENDAR_EVENT_ENCRYPTED_FIELDS` from encryption-helpers, `gte` and `asc` from drizzle-orm
3. Add 6th query in `Promise.all` inside `handleBrainQuery`
4. Decrypt result using `CALENDAR_EVENT_ENCRYPTED_FIELDS`
5. Format as context section following existing pattern
6. Push `"calendar"` to `sourcesUsed`

### Pattern Conformance

Follows the exact same pattern as the existing 5 data sources:
- Parallel fetch in `Promise.all`
- Decrypt with `decryptRows`
- Format as markdown section in `contextParts`
- Track in `sourcesUsed`
