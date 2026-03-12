# Krisp Meetings: List + Card View Toggle

**Date**: 2026-03-12
**Status**: Approved

## Overview

Add a list/card view toggle to the krisp meetings page (`/krisp`). Card view preserves the existing 3-column grid. List view introduces a two-panel split layout with compact meeting rows on the left and an inline preview pane on the right, inspired by the inbox page's existing pattern.

## Layout & View Toggle

- `viewMode` state: `"list" | "cards"` (default `"cards"`)
- Persisted in `localStorage` key `"krisp-view-mode"`
- Toggle button group in the header bar (horizontal lines icon for list, grid icon for cards) — same pattern as inbox's view toggle
- URL param `tab=meetings|analytics` unchanged; view mode is orthogonal

**Card view**: Existing 3-column grid, no changes.

**List view**: Two-panel split:
- **Left panel**: Compact meeting rows, resizable (default 480px, min 280px, max 800px, persisted in `localStorage` key `"krisp-list-width"`)
- **Resize handle**: Draggable divider (same implementation as inbox)
- **Right panel**: Meeting detail preview
- On mobile, clicking a row opens the `MeetingDetailDrawer` directly instead of the split pane

## List Row Design

Each row in the left panel:
- **Primary line**: Meeting title (truncated, bold) + date right-aligned (muted, short format e.g. "Mar 10, 2026")
- **Secondary line**: Duration pill (e.g. "45 min") + speaker names comma-separated (truncated) + action item count badge (e.g. "3 items")
- **States**: Hover highlight, selected row gets `primary/10` background + left border accent
- **Delete**: Hover-reveal trash icon with confirmation overlay (same as current cards)
- Rows are `divide-y` separated (no card gaps)

## Preview Pane

Right panel when a meeting is selected:

**Header** (sticky, border-bottom):
- Meeting title (semibold)
- Date + duration (muted)
- Speakers as pill badges
- "Open Full" button → opens `MeetingDetailDrawer`

**Body** (scrollable):
- Key Points: bullet list from `meeting.content`
- Transcript snippet: first ~500 chars of `raw_content` with "View full transcript" link → opens drawer

**Empty state**: Centered muted text "Select a meeting to preview"
**Loading state**: Skeleton shimmer

No new API calls — preview renders from already-fetched meeting data.

## Search Integration

Search bar + AI answer section sits above both view modes (unchanged).

- **Card view**: Search results in existing expandable card format
- **List view**: Search results render as compact rows in the left panel, replacing the full list. AI answer stays above. Clicking a result loads it in the preview pane.

Filters (`MeetingFilters`) remain above both views, working identically.

## Technical Notes

- No new API endpoints needed
- Reuse existing `MeetingDetailDrawer` for full detail
- Match inbox's resize handle implementation (`onMouseDown` + `mousemove`/`mouseup` listeners)
- All changes scoped to `app/(app)/krisp/page.tsx`
