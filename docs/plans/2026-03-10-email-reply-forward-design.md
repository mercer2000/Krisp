# Email Reply, Reply All & Forward with AI — Design

## Overview

Add Reply, Reply All, and Forward capabilities to the email detail page for Outlook users, using Microsoft Graph's native threading endpoints. Each action has a manual mode and an AI-assisted mode that generates a draft for user review before sending. Outlook-only (Gmail/Zoom emails won't show these actions).

## Architecture

### Components

- **Header split buttons**: Three split buttons (Reply, Reply All, Forward) — main click = manual, dropdown = AI variant
- **Inline compose pane**: Appears below email body (Gmail-style) with To/CC/BCC chip inputs, markdown editor with preview, AI context selector
- **Backend API**: Three new routes using Graph's native `reply`/`replyAll`/`forward` endpoints for proper threading, plus AI draft generation
- **Keyboard shortcuts**: Command mode (active when compose not focused) vs insert mode

### Data Flow

1. User clicks action (or presses shortcut) → compose pane opens, pre-populated
2. If AI variant: user selects context level → API fetches context → AI generates markdown draft
3. User edits draft in markdown, toggles preview to check formatting
4. User adjusts To/CC/BCC chips as needed
5. Send → API converts markdown to HTML → Graph native endpoint sends with proper threading

### Pre-population Logic

| Action    | To               | CC                                    | BCC | Subject           |
|-----------|------------------|---------------------------------------|-----|-------------------|
| Reply     | Original sender  | —                                     | —   | `Re: {subject}`   |
| Reply All | Original sender  | All original To + CC (minus self)     | —   | `Re: {subject}`   |
| Forward   | Empty            | —                                     | —   | `Fwd: {subject}`  |

## Compose Pane UI

Inline below email body, pushes email content up.

```
┌─────────────────────────────────────────────────────┐
│ To: [chip][chip][+ type here]              +CC +BCC │
│ CC: [chip][+ type here]           (collapsed default)│
│ BCC: [+ type here]                (collapsed default)│
├─────────────────────────────────────────────────────┤
│ ┌─ Context: [This email ▾] ──── [Draft with AI] ─┐ │
│ │                                                  │ │
│ │  Markdown editor area                            │ │
│ │  (or preview when toggled)                       │ │
│ │                                                  │ │
│ └──────────────────────────────────────────────────┘ │
│ [Preview toggle]              [Cancel] [Send ⌘↵]    │
└─────────────────────────────────────────────────────┘
```

### Chip Input Behavior

- Typing an email + Enter/Tab/comma creates a chip
- Backspace on empty input removes last chip
- Each chip has an `x` button on hover
- Reply All auto-populates To with sender, CC with original To+CC minus the user's own email

### Compose States

- **Manual mode**: Empty body, no context dropdown
- **AI mode**: Context dropdown + "Draft with AI" button, generates immediately with default context
- **Generating**: Spinner in editor area, "Generating draft..." text
- **Generated**: Draft in textarea, user edits freely. "Regenerate" link available

## Header Split Buttons

```
[← Back]                    [Reply ▾] [Reply All ▾] [Forward ▾] [Send to Page] [Delete]
```

### Split Button Anatomy

```
┌──────────┬───┐
│  Reply   │ ▾ │   ← Click main area = manual mode
└──────────┴───┘   ← Click ▾ = dropdown with AI variant
```

Each dropdown has one item (the AI variant) with a sparkle icon (✦). Active button gets subtle highlight when compose pane is open for that action.

Mobile: icon-only on small screens (same pattern as existing buttons).

## Keyboard Shortcuts

### Command Mode (compose fields NOT focused)

| Key       | Action                |
|-----------|-----------------------|
| `R`       | Open Reply (manual)   |
| `A`       | Open Reply All (manual)|
| `F`       | Open Forward (manual) |
| `Shift+R` | Open Reply with AI   |
| `Shift+A` | Open Reply All with AI|
| `Shift+F` | Open Forward with AI |
| `Escape`  | Close compose pane   |

### Always Active

| Key              | Action                  |
|------------------|-------------------------|
| `Cmd/Ctrl+Enter` | Send                   |
| `Cmd/Ctrl+Shift+P` | Toggle markdown preview |
| `Escape`         | Close compose pane (blur first if focused) |
| `Tab`            | Move between To → CC → BCC → Body |

### Mode Detection

- Listen for `keydown` on the page
- If `document.activeElement` is inside the compose pane → insert mode (only "always active" shortcuts)
- Otherwise → command mode (single-key shortcuts)
- `Escape` in insert mode: first blurs field, second closes pane

## API Design

### New Endpoints

| Endpoint                       | Method | Purpose                              |
|--------------------------------|--------|--------------------------------------|
| `/api/emails/[id]/reply`       | POST   | Send reply via Graph                 |
| `/api/emails/[id]/reply-all`   | POST   | Send reply-all via Graph             |
| `/api/emails/[id]/reply-draft` | POST   | Generate AI draft for any action     |

### Refactored Endpoint

| Endpoint                       | Method | Change                                           |
|--------------------------------|--------|--------------------------------------------------|
| `/api/emails/[id]/forward`     | POST   | Migrate from `sendMail` to Graph native forward  |

### `POST /api/emails/[id]/reply` and `/reply-all`

```json
{
  "bodyMarkdown": "Thanks, I'll review this by Friday.",
  "to": ["override@example.com"],
  "cc": ["extra@example.com"],
  "bcc": ["hidden@example.com"]
}
```

- Converts markdown → HTML via `marked`
- Calls `POST /users/{mailbox}/messages/{messageId}/reply` (or `/replyAll`)
- Graph handles threading, quoting original message, headers
- Returns `{ message: "Reply sent" }`

### `POST /api/emails/[id]/forward` (refactored)

```json
{
  "bodyMarkdown": "Please take a look at this.",
  "to": ["recipient@example.com"],
  "cc": ["fyi@example.com"],
  "bcc": ["hidden@example.com"]
}
```

- Calls `POST /users/{mailbox}/messages/{messageId}/forward`
- Replaces current manual HTML building + `sendGraphMail`

### `POST /api/emails/[id]/reply-draft`

```json
{
  "action": "reply | reply_all | forward",
  "contextLevel": "email_only | full_thread | thread_and_app"
}
```

- Returns `{ draft: "markdown string", intent?: "delegation" | "fyi" | ... }`
- For `full_thread`: fetches conversation via `GET /users/{mailbox}/messages?$filter=conversationId eq '{id}'`
- For `thread_and_app`: also queries Kanban cards, action items, meetings related to sender/subject

### Graph Library Additions (`lib/graph/messages.ts`)

- `replyGraphMessage(mailbox, token, messageId, { body, to?, cc?, bcc? })`
- `replyAllGraphMessage(mailbox, token, messageId, { body, to?, cc?, bcc? })`
- `forwardGraphMessage(mailbox, token, messageId, { body, to, cc?, bcc? })`
- `fetchConversationThread(mailbox, token, conversationId)`

## AI Draft Generation

### New Prompt: `PROMPT_EMAIL_REPLY_DRAFT`

Generates contextually appropriate replies in markdown. Unlike the forward draft (1-2 sentence preamble), replies address the email content directly.

### Behavior by Action

- **Reply/Reply All**: "You are replying to this email. Write a professional, helpful response."
- **Forward**: "You are forwarding this email. Write a brief preamble explaining why."

### Context Assembly by Level

| Level            | Data Sent to AI                                                    | Latency |
|------------------|--------------------------------------------------------------------|---------|
| This email only  | Subject, sender, body (truncated 2k chars)                         | ~1-2s   |
| Full thread      | All messages in conversation via Graph `conversationId`, chronological | ~2-4s |
| Thread + my data | Thread + Kanban cards with matching sender/subject + recent action items + related meeting notes | ~3-5s |

### Thread Context Format

```
CONVERSATION THREAD (oldest first):
---
From: alice@example.com | Date: Mar 5
Can we schedule a review for the Q1 report?
---
From: you@example.com | Date: Mar 6
Sure, how about Thursday?
---
From: alice@example.com | Date: Mar 7  ← (email being replied to)
Thursday works. Can you bring the updated figures?
```

### App Context Format (appended for "thread + my data")

```
RELATED WORK ITEMS:
- [Card] "Finalize Q1 report" (High priority, due Mar 12, column: In Progress)
- [Action Item] "Update Q1 figures" (from meeting "Weekly Standup" Mar 4)
```

### Output

Always markdown. AI instructed to keep it concise (3-5 sentences for replies, 1-2 for forwards).

## Markdown Rendering & Dependencies

### Client-side (preview)

- `react-markdown` with `remark-gfm` plugin (tables, strikethrough, task lists)
- Toggle button switches between edit (`<textarea>`) and preview (rendered markdown)

### Server-side (sending)

- `marked` converts markdown to HTML before passing to Graph API
- Post-process to add inline styles (font-family, font-size, link colors) for email client compatibility
- No CSS classes — email clients strip them

### New Dependencies

| Package          | Purpose                        | Size       |
|------------------|--------------------------------|------------|
| `react-markdown` | Preview rendering (client)     | ~12kb gzip |
| `remark-gfm`    | GFM support (tables, etc.)     | ~2kb gzip  |
| `marked`         | Markdown → HTML (server)       | ~7kb gzip  |

## Scope Boundaries

**In scope**:
- Reply, Reply All, Forward (manual + AI) for Outlook emails
- Inline compose pane with chip inputs, markdown editor, preview
- Graph native threading endpoints
- AI draft with 3 context levels
- Keyboard shortcuts with command/insert mode

**Out of scope** (future):
- Gmail reply/forward (no Graph API)
- Rich text editor (upgrade from markdown)
- Contact autocomplete in chip inputs
- Attachment support in compose
- Draft saving / auto-save
