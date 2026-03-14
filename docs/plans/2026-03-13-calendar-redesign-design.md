# Calendar Redesign Design

**Date:** 2026-03-13
**Status:** Approved

## Summary

Redesign the calendar page (`/calendar`) from a flat list view into a full visual calendar with Month, Week, Day, and Agenda views. Events are color-coded by connected calendar account. Read-only with the ability to create Kanban cards from events.

## Requirements

- **Views:** Month / Week / Day / Agenda (4 views, togglable)
- **Event colors:** Auto-assigned per calendar account from an 8-color palette
- **Interaction:** Read-only events, click for detail popover, "Create Card" action to spawn a Kanban card
- **Data:** Existing API and hooks — no new backend routes needed for display
- **Calendar sources:** Google Calendar, Outlook, Microsoft Graph (all already syncing)

## Aesthetic Direction

Editorial / Refined Minimalism. Dense information presented calmly.

- **Typography:** Geist Sans throughout. Larger weight + letter-spacing for month/date headers. Lighter weight for time labels.
- **Color palette:** Existing CSS variables for structure. Account colors from curated 8-color palette (muted, not neon): slate blue, terracotta, sage, plum, amber, teal, rose, indigo.
- **Grid:** Thin 1px borders with subtle opacity. Current day gets a soft highlight wash. Current time shown as a thin accent-colored horizontal line in week/day views.
- **Events:** Compact pills in month view, taller blocks in week/day. Left-border accent in account color. Hover elevation shift.
- **Dark mode:** Fully supported via existing CSS variables. Account colors adjust automatically.

## Component Architecture

```
CalendarPage
├── CalendarHeader
│   ├── Navigation (← Today →)
│   ├── Current date/range title
│   ├── View toggle (Month / Week / Day / Agenda)
│   ├── Account filter toggles (color dots + email)
│   └── Sync button
├── CalendarView (switches on active view)
│   ├── MonthView — 6-row grid, event pills, "+N more" overflow
│   ├── WeekView — 7-column time grid (scrollable), all-day row
│   ├── DayView — single-column time grid, wider event blocks
│   └── AgendaView — existing list view, cleaned up
└── EventDetailPopover
    ├── Event info (title, time, location, organizer, attendees)
    ├── Provider badge + "Open in Google/Outlook" link
    └── "Create Card" button → board/column selector
```

## File Organization

```
app/(app)/calendar/
├── page.tsx                    (rewritten to use new components)

components/calendar/
├── CalendarHeader.tsx
├── MonthView.tsx
├── WeekView.tsx
├── DayView.tsx
├── AgendaView.tsx
├── EventDetailPopover.tsx
├── EventPill.tsx               (compact event in month grid)
├── EventBlock.tsx              (time-block in week/day grid)
├── TimeGrid.tsx                (shared hour-line grid for week/day)
├── CreateCardFromEvent.tsx     (mini-form in popover)
└── calendarUtils.ts            (date math, color palette, grid helpers)
```

## Data Flow & State

**Client-side state (in CalendarPage):**
- `activeView`: `"month" | "week" | "day" | "agenda"` — persisted to URL search params
- `currentDate`: anchor date determining which period is displayed
- `visibleAccounts`: `Set<string>` of account IDs toggled on (all by default)
- `selectedEvent`: `CalendarEvent | null` — drives detail popover

**Navigation:**
- `← / →` shifts by 1 month/week/day based on active view
- "Today" resets to now
- Click day number in Month → Day view for that date
- Click "+N more" in Month → Day view

**Data fetching:**
- Reuse `useCalendarEventsInRange(start, end)` — compute range from view + currentDate
- Account status hooks unchanged: `useGoogleCalendarStatus()`, `useOutlookCalendarStatus()`, `useSyncState()`

**Color assignment:**
- `getAccountColor(accountId, allAccounts)` maps account index to 8-color palette
- Stable ordering: accounts sorted by provider then email

**"Create Card" flow:**
- Board selector → column selector → pre-filled title (event subject) → POST to card creation endpoint
- Toast confirmation on success

## Layout Details

- **Week/Day time grid:** 24 hours, 60px per hour, scrollable, auto-scrolls to current time
- **Month view:** Fixed 6-row grid, up to 3 event pills per cell, "+N more" for overflow
- **All-day events:** Dedicated row above time grid in Week/Day views
- **Event popover:** Positioned relative to clicked event, not a full modal

## Non-goals

- Write access to Google/Outlook (would require new OAuth scopes)
- Drag-and-drop event rescheduling
- Event creation in the calendar itself
- Recurring event expansion (display as-synced from provider)
