# Krisp Meetings List/Card View Toggle Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a list/card view toggle to the krisp meetings page with a two-panel split layout (compact list + inline preview pane) for list mode.

**Architecture:** All changes are in a single file `app/(app)/krisp/page.tsx`. Add `viewMode` state with localStorage persistence, a toggle button group in the header, a list view with compact rows, a resizable split pane with a meeting preview panel, and wire existing data into both views. No new API endpoints.

**Tech Stack:** React 19, Next.js, Tailwind CSS, existing Meeting types and MeetingDetailDrawer component.

---

### Task 1: Add viewMode state and toggle UI

**Files:**
- Modify: `app/(app)/krisp/page.tsx`

**Step 1: Add viewMode state and focusedMeetingId state**

After line 60 (`const [openMeetingId, setOpenMeetingId] = useState<number | null>(null);`), add:

```tsx
// View mode: "list" or "cards" (persisted in localStorage)
const [viewMode, setViewMode] = useState<"list" | "cards">(() => {
  if (typeof window === "undefined") return "cards";
  return (localStorage.getItem("krisp-view-mode") as "list" | "cards") || "cards";
});

// Focused meeting for list-view preview pane
const [focusedMeetingId, setFocusedMeetingId] = useState<number | null>(null);
```

After the existing `resizeStartWidthRef` (which doesn't exist yet — we'll add it below), persist viewMode changes:

```tsx
useEffect(() => {
  localStorage.setItem("krisp-view-mode", viewMode);
}, [viewMode]);
```

**Step 2: Add the toggle button group in the header**

Inside the header `<div className="flex items-center px-6 py-4">`, after the closing `</div>` of the title block (line 253), add a `ml-auto` toggle group:

```tsx
{/* View mode toggle */}
{activeTab === "meetings" && (
  <div className="ml-auto flex items-center rounded-lg border border-[var(--border)] overflow-hidden">
    <button
      onClick={() => setViewMode("list")}
      className={`px-2.5 py-2 text-sm transition-colors ${
        viewMode === "list"
          ? "bg-[var(--primary)]/10 text-[var(--primary)]"
          : "text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--accent)]"
      }`}
      title="List view"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="8" y1="6" x2="21" y2="6" />
        <line x1="8" y1="12" x2="21" y2="12" />
        <line x1="8" y1="18" x2="21" y2="18" />
        <line x1="3" y1="6" x2="3.01" y2="6" />
        <line x1="3" y1="12" x2="3.01" y2="12" />
        <line x1="3" y1="18" x2="3.01" y2="18" />
      </svg>
    </button>
    <button
      onClick={() => setViewMode("cards")}
      className={`px-2.5 py-2 text-sm transition-colors ${
        viewMode === "cards"
          ? "bg-[var(--primary)]/10 text-[var(--primary)]"
          : "text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--accent)]"
      }`}
      title="Card view"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    </button>
  </div>
)}
```

**Step 3: Verify toggle renders and switches state**

Run: `npm run dev`
Open: `http://localhost:3000/krisp`
Expected: Toggle buttons visible next to "Meetings" title. Clicking switches between them. Cards grid still renders for both modes (list view not wired yet).

**Step 4: Commit**

```bash
git add app/(app)/krisp/page.tsx
git commit -m "feat(krisp): add viewMode state and list/card toggle UI"
```

---

### Task 2: Add resizable split pane infrastructure

**Files:**
- Modify: `app/(app)/krisp/page.tsx`

**Step 1: Add resize state and refs**

After the `focusedMeetingId` state, add:

```tsx
// Resizable list column width (persisted in localStorage)
const [listWidth, setListWidth] = useState<number>(() => {
  if (typeof window === "undefined") return 480;
  const saved = localStorage.getItem("krisp-list-width");
  return saved ? Math.max(280, Math.min(800, parseInt(saved, 10))) : 480;
});
const [isResizing, setIsResizing] = useState(false);
const listColumnRef = useRef<HTMLDivElement>(null);
const resizeStartXRef = useRef(0);
const resizeStartWidthRef = useRef(0);
```

Note: `useRef` is already imported at the top of this file — no, it is NOT currently imported. Add `useRef` to the React import:

```tsx
import { useState, useEffect, useCallback, Suspense, useRef } from "react";
```

**Step 2: Add handleResizeStart callback**

After the `handleDeleteCancel` function (~line 232), add:

```tsx
const handleResizeStart = useCallback((e: React.MouseEvent) => {
  e.preventDefault();
  resizeStartXRef.current = e.clientX;
  resizeStartWidthRef.current = listColumnRef.current?.offsetWidth ?? listWidth;
  setIsResizing(true);
  document.body.style.cursor = "col-resize";
  document.body.style.userSelect = "none";

  function onMouseMove(ev: MouseEvent) {
    const delta = ev.clientX - resizeStartXRef.current;
    const newWidth = Math.max(280, Math.min(800, resizeStartWidthRef.current + delta));
    if (listColumnRef.current) {
      listColumnRef.current.style.width = `${newWidth}px`;
    }
  }
  function onMouseUp(ev: MouseEvent) {
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
    setIsResizing(false);
    const delta = ev.clientX - resizeStartXRef.current;
    const finalWidth = Math.max(280, Math.min(800, resizeStartWidthRef.current + delta));
    setListWidth(finalWidth);
    localStorage.setItem("krisp-list-width", String(finalWidth));
    document.removeEventListener("mousemove", onMouseMove);
    document.removeEventListener("mouseup", onMouseUp);
  }
  document.addEventListener("mousemove", onMouseMove);
  document.addEventListener("mouseup", onMouseUp);
}, [listWidth]);
```

**Step 3: Commit**

```bash
git add app/(app)/krisp/page.tsx
git commit -m "feat(krisp): add resizable split pane state and resize handler"
```

---

### Task 3: Build the list view layout with meeting rows

**Files:**
- Modify: `app/(app)/krisp/page.tsx`

**Step 1: Add a helper to get the focused meeting object**

After `getActionItems`, add:

```tsx
const focusedMeeting = meetings.find((m) => m.id === focusedMeetingId) ?? null;
```

**Step 2: Replace the card grid section with a conditional view**

Find the existing card grid (the `<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">` block containing `meetings.map`). Wrap it so that:

- When `viewMode === "cards"`: render the existing card grid unchanged
- When `viewMode === "list"`: render the new split layout

The list view layout structure:

```tsx
{viewMode === "list" ? (
  <div className="flex flex-1 overflow-hidden -mx-6 -mb-8" style={{ height: "calc(100vh - 280px)" }}>
    {/* Left panel: meeting list */}
    <div
      ref={listColumnRef}
      className={`${focusedMeetingId != null ? "hidden md:flex md:flex-col" : "flex flex-col flex-1"} overflow-auto border-r border-[var(--border)]`}
      style={focusedMeetingId != null ? { width: listWidth } : undefined}
    >
      <div className="divide-y divide-[var(--border)]">
        {meetings.map((meeting) => {
          const actionItems = getActionItems(meeting);
          const isSelected = focusedMeetingId === meeting.id;
          return (
            <div
              key={meeting.id}
              onClick={() => {
                if (window.innerWidth >= 768) {
                  setFocusedMeetingId(meeting.id);
                } else {
                  setOpenMeetingId(meeting.id);
                }
              }}
              className={`group relative px-4 py-3 cursor-pointer transition-colors ${
                isSelected
                  ? "bg-[var(--primary)]/10 border-l-2 border-l-[var(--primary)]"
                  : "hover:bg-[var(--accent)] border-l-2 border-l-transparent"
              }`}
            >
              {/* Delete button */}
              {confirmingDeleteId === meeting.id ? (
                <div className="absolute inset-0 z-10 flex items-center justify-center gap-2 bg-[var(--card)]/95 backdrop-blur-sm">
                  <button
                    type="button"
                    onClick={(e) => handleDeleteConfirm(e, meeting.id)}
                    disabled={deletingId === meeting.id}
                    className="px-3 py-1 text-xs font-medium rounded-md bg-[var(--destructive)] text-white hover:opacity-90 disabled:opacity-50"
                  >
                    {deletingId === meeting.id ? "Deleting..." : "Delete"}
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteCancel}
                    className="px-3 py-1 text-xs font-medium rounded-md border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--secondary)]"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={(e) => handleDeleteClick(e, meeting.id)}
                  className="absolute top-2 right-2 p-1 rounded-md opacity-0 group-hover:opacity-100 hover:bg-[var(--destructive)]/10 text-[var(--muted-foreground)] hover:text-[var(--destructive)] transition-all"
                  title="Delete meeting"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}

              {/* Primary line */}
              <div className="flex items-baseline justify-between gap-3 pr-6">
                <h3 className="font-medium text-sm text-[var(--foreground)] truncate">
                  {meeting.meeting_title || "Untitled Meeting"}
                </h3>
                <span className="text-xs text-[var(--muted-foreground)] whitespace-nowrap flex-shrink-0">
                  {formatDateShort(meeting.meeting_start_date)}
                </span>
              </div>

              {/* Secondary line */}
              <div className="flex items-center gap-2 mt-1 text-xs text-[var(--muted-foreground)]">
                {meeting.meeting_duration && (
                  <span className="px-1.5 py-0.5 rounded bg-[var(--secondary)] text-[var(--secondary-foreground)]">
                    {formatDuration(meeting.meeting_duration)}
                  </span>
                )}
                {Array.isArray(meeting.speakers) && meeting.speakers.length > 0 && (
                  <span className="truncate">
                    {meeting.speakers.slice(0, 3).map((s) =>
                      typeof s === "string" ? s : [s.first_name, s.last_name].filter(Boolean).join(" ") || `Speaker ${s.index}`
                    ).join(", ")}
                    {meeting.speakers.length > 3 ? ` +${meeting.speakers.length - 3}` : ""}
                  </span>
                )}
                {actionItems.length > 0 && (
                  <>
                    <span className="text-[var(--border)]">·</span>
                    <span>{actionItems.length} item{actionItems.length !== 1 ? "s" : ""}</span>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>

    {/* Resize handle */}
    {focusedMeetingId != null && (
      <div
        className="hidden md:flex items-stretch flex-shrink-0 cursor-col-resize group"
        onMouseDown={handleResizeStart}
      >
        <div className="w-1 hover:w-1.5 bg-[var(--border)] group-hover:bg-[var(--primary)]/40 group-active:bg-[var(--primary)] transition-colors" />
      </div>
    )}

    {/* Transparent overlay during resize */}
    {isResizing && (
      <div className="fixed inset-0 z-50 cursor-col-resize" />
    )}

    {/* Right panel: preview pane (desktop only) */}
    {focusedMeetingId != null && (
      <div className="hidden md:flex flex-col flex-1 overflow-hidden bg-[var(--background)]">
        {/* Preview content — Task 4 */}
        <div className="flex-1 flex items-center justify-center text-sm text-[var(--muted-foreground)]">
          Select a meeting to preview (placeholder)
        </div>
      </div>
    )}

    {/* Empty state when no meeting selected (desktop) */}
    {focusedMeetingId == null && (
      <div className="hidden md:flex flex-col flex-1 items-center justify-center text-sm text-[var(--muted-foreground)]">
        Select a meeting to preview
      </div>
    )}
  </div>
) : (
  /* existing card grid — keep as-is */
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {/* ... existing meetings.map card code ... */}
  </div>
)}
```

Important: The existing card grid code stays **exactly as-is** inside the `cards` branch. Don't modify it.

**Step 3: Verify list renders**

Run: `npm run dev`
Open: `http://localhost:3000/krisp`, toggle to list view.
Expected: Compact rows appear in left panel. Clicking a row on desktop shows placeholder preview. Clicking on mobile opens the drawer.

**Step 4: Commit**

```bash
git add app/(app)/krisp/page.tsx
git commit -m "feat(krisp): add list view with compact meeting rows and split layout"
```

---

### Task 4: Build the preview pane content

**Files:**
- Modify: `app/(app)/krisp/page.tsx`

**Step 1: Replace the preview placeholder with real content**

Replace the placeholder `<div>Select a meeting to preview (placeholder)</div>` inside the right panel with:

```tsx
{focusedMeeting ? (
  <div className="flex-1 overflow-auto">
    {/* Header */}
    <div className="px-5 py-4 border-b border-[var(--border)]">
      <div className="flex items-start justify-between gap-3 mb-2">
        <h2 className="text-base font-semibold text-[var(--foreground)] leading-snug">
          {focusedMeeting.meeting_title || "Untitled Meeting"}
        </h2>
        <button
          type="button"
          onClick={() => setOpenMeetingId(focusedMeeting.id)}
          className="flex-shrink-0 text-xs text-[var(--primary)] hover:underline whitespace-nowrap"
        >
          Open full
        </button>
      </div>
      <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
        <span>{formatDate(focusedMeeting.meeting_start_date)}</span>
        {focusedMeeting.meeting_duration && (
          <>
            <span className="text-[var(--border)]">·</span>
            <span>{formatDuration(focusedMeeting.meeting_duration)}</span>
          </>
        )}
      </div>
      {/* Speakers */}
      {Array.isArray(focusedMeeting.speakers) && focusedMeeting.speakers.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {focusedMeeting.speakers.map((speaker, i) => {
            const name = typeof speaker === "string"
              ? speaker
              : [speaker.first_name, speaker.last_name].filter(Boolean).join(" ") || `Speaker ${speaker.index}`;
            return (
              <span
                key={i}
                className="text-xs px-2 py-0.5 bg-[var(--secondary)] text-[var(--secondary-foreground)] rounded"
              >
                {name}
              </span>
            );
          })}
        </div>
      )}
    </div>

    {/* Body */}
    <div className="p-5 space-y-5">
      {/* Key Points */}
      {Array.isArray(focusedMeeting.content) && focusedMeeting.content.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-[var(--foreground)] mb-2">Key Points</h3>
          <ul className="space-y-2">
            {focusedMeeting.content.map((kp, i) => (
              <li key={kp.id || i} className="text-sm text-[var(--muted-foreground)] flex gap-2 leading-snug">
                <svg className="w-4 h-4 text-[var(--primary)] flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                <span>{kp.description}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Transcript snippet */}
      {focusedMeeting.raw_content && (
        <div>
          <h3 className="text-sm font-medium text-[var(--foreground)] mb-2">Transcript</h3>
          <p className="text-sm text-[var(--muted-foreground)] whitespace-pre-wrap leading-relaxed">
            {focusedMeeting.raw_content.length > 500
              ? focusedMeeting.raw_content.slice(0, 500) + "..."
              : focusedMeeting.raw_content}
          </p>
          {focusedMeeting.raw_content.length > 500 && (
            <button
              type="button"
              onClick={() => setOpenMeetingId(focusedMeeting.id)}
              className="mt-2 text-xs text-[var(--primary)] hover:underline"
            >
              View full transcript
            </button>
          )}
        </div>
      )}

      {/* No content fallback */}
      {(!focusedMeeting.content || focusedMeeting.content.length === 0) && !focusedMeeting.raw_content && (
        <p className="text-sm text-[var(--muted-foreground)] italic">No content recorded for this meeting.</p>
      )}
    </div>
  </div>
) : (
  <div className="flex-1 flex items-center justify-center text-sm text-[var(--muted-foreground)]">
    Meeting not found
  </div>
)}
```

**Step 2: Verify preview works**

Run: `npm run dev`
Open: `http://localhost:3000/krisp`, toggle to list view, click a meeting.
Expected: Preview pane shows title, date, duration, speakers, key points, transcript snippet. "Open full" opens drawer.

**Step 3: Commit**

```bash
git add app/(app)/krisp/page.tsx
git commit -m "feat(krisp): add meeting preview pane with key points and transcript"
```

---

### Task 5: Wire search results into list view

**Files:**
- Modify: `app/(app)/krisp/page.tsx`

**Step 1: Make search results render as list rows in list mode**

The search results section (the `{result && (...)}` block starting around line 347) currently always renders as expandable cards. When `viewMode === "list"`, the search result meetings should replace the meeting list in the left panel instead.

Update the `{result && (...)}` block:

- The AI answer panel stays above both views (no change).
- When `viewMode === "cards"`: keep existing search result cards.
- When `viewMode === "list"`: skip rendering search result cards here — instead, make the list panel show `result.meetings` instead of `meetings`.

The simplest approach: compute the displayed meetings list:

```tsx
const displayedMeetings = result && result.meetings.length > 0 ? result.meetings : meetings;
```

Then use `displayedMeetings` in the list view's `meetings.map(...)` instead of `meetings`.

For the card view, keep the existing search result rendering as-is (the expandable cards above the main grid).

**Step 2: Verify search works in list mode**

Search for something, toggle to list view.
Expected: Search result meetings appear in the list. Preview pane works with search results.

**Step 3: Commit**

```bash
git add app/(app)/krisp/page.tsx
git commit -m "feat(krisp): wire search results into list view"
```

---

### Task 6: Polish and loading states

**Files:**
- Modify: `app/(app)/krisp/page.tsx`

**Step 1: Add list view loading skeleton**

When `meetingsLoading && viewMode === "list"`, render skeleton rows instead of the card grid skeletons:

```tsx
<div className="divide-y divide-[var(--border)]">
  {[1, 2, 3, 4, 5, 6].map((i) => (
    <div key={i} className="px-4 py-3 animate-pulse">
      <div className="flex items-center justify-between gap-3">
        <div className="h-4 bg-[var(--secondary)] rounded w-48" />
        <div className="h-3 bg-[var(--secondary)] rounded w-20" />
      </div>
      <div className="flex items-center gap-2 mt-2">
        <div className="h-3 bg-[var(--secondary)] rounded w-12" />
        <div className="h-3 bg-[var(--secondary)] rounded w-32" />
      </div>
    </div>
  ))}
</div>
```

**Step 2: Clear focusedMeetingId when switching to card view**

```tsx
useEffect(() => {
  if (viewMode === "cards") {
    setFocusedMeetingId(null);
  }
}, [viewMode]);
```

**Step 3: Clear focusedMeetingId when a meeting is deleted**

In `handleDeleteConfirm`, after `setMeetings(prev => prev.filter(...))`, add:

```tsx
if (focusedMeetingId === meetingId) {
  setFocusedMeetingId(null);
}
```

**Step 4: Verify all states work**

- Toggle between views while loading
- Delete a focused meeting in list view
- Switch to card view and back — preview clears
- Empty state in list view
- Mobile — clicking row opens drawer, no split pane

**Step 5: Commit**

```bash
git add app/(app)/krisp/page.tsx
git commit -m "feat(krisp): add loading skeletons, cleanup state on view/delete transitions"
```
