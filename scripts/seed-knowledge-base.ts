/**
 * Seed the support knowledge base with detailed articles about MyOpenBrain.
 *
 * Usage:  npx tsx scripts/seed-knowledge-base.ts
 *
 * This script calls ingestText() directly (no HTTP / admin auth needed)
 * and requires DATABASE_URL + OPENAI_API_KEY in .env.local.
 */

// env vars must be loaded before any imports that use them.
// Run with: npx tsx --env-file=.env.local scripts/seed-knowledge-base.ts

import { ingestText } from "@/lib/support/kb-ingest";

// ── Articles ──────────────────────────────────────────────

interface Article {
  label: string;
  content: string;
}

const articles: Article[] = [
  // ─────────────────────────────────────────────────────────
  // 1. Getting Started
  // ─────────────────────────────────────────────────────────
  {
    label: "Getting Started with MyOpenBrain",
    content: `# Getting Started with MyOpenBrain

MyOpenBrain is a 6-in-1 productivity platform that brings together meeting recording, email management, AI-powered search, decision tracking, task management, and weekly planning into a single workspace. The tagline: "Every call. Every email. Every chat. Searchable knowledge."

## Quick Setup (Under 5 Minutes)

1. **Create your account** — Sign up at myopenbrain.com with your email or Google account. You get a 14-day free trial with full Second Brain plan access. No credit card required.

2. **Install the desktop recorder** — Download the lightweight MyOpenBrain app for Windows. It runs silently in the background and automatically records and transcribes every call (Zoom, Teams, Meet, Slack, and even in-person conversations). No bots join your meetings — no one knows it's running.

3. **Connect your email** — Go to Settings > Integrations and connect your Gmail or Outlook account. MyOpenBrain will automatically classify incoming emails, extract action items, and make your email history searchable.

4. **Connect your calendar** — Link your Google Calendar or Outlook calendar so MyOpenBrain can show your events and use them to inform weekly planning.

5. **Create your first board** — Navigate to Boards in the sidebar and create a Kanban board. Add columns for your workflow (e.g., To Do, In Progress, Done) and start adding task cards.

## Core Navigation

The sidebar on the left gives you access to all major areas:

- **Dashboard** — Your personalized overview with widgets showing analytics, upcoming events, overdue tasks, and daily briefings.
- **Boards** — Your Kanban task boards for managing work.
- **Inbox** — Your unified email inbox with smart labels and AI classification.
- **Brain** — AI-powered search and chat across all your data (meetings, emails, decisions, tasks).
- **Calendar** — Multi-source calendar with month, week, day, and agenda views.
- **Analytics** — Meeting analytics with search, filtering, and duration tracking.
- **Reviews** — Weekly planning ritual: Assess, Review, and Plan your week.
- **Contacts** — Email contact aggregation with frequency tracking.
- **Activity** — Complete action history across all features.
- **Workspace** — Notion-like pages and documents for knowledge management.
- **Trash** — Recover deleted items within the retention window.
- **Settings** — Account, integrations, billing, and customization.

## What Makes MyOpenBrain Different

Unlike tools that do one thing well, MyOpenBrain connects everything. Your meeting transcript links to the email thread, the decisions made, and the action items that followed. No other tool gives you that cross-source context. Most users save 3+ hours per week on email and meeting overhead.`,
  },

  // ─────────────────────────────────────────────────────────
  // 2. Email Management
  // ─────────────────────────────────────────────────────────
  {
    label: "Email Management & Inbox",
    content: `# Email Management & Inbox

MyOpenBrain includes a full-featured email management system that works alongside your existing inbox — nothing changes about how you send and receive email.

## Connecting Email Accounts

Go to Settings > Integrations to connect email accounts:

- **Gmail** — Uses Google OAuth. Click "Connect Gmail" and authorize MyOpenBrain to read your emails. Supports push notifications for real-time syncing.
- **Outlook / Microsoft 365** — Uses Microsoft Graph API. Click "Connect Outlook" and authorize through Microsoft. Supports webhook subscriptions for real-time syncing.

The Focus plan supports 1 email account. The Second Brain plan supports up to 3 email accounts.

## Inbox Features

Your MyOpenBrain inbox provides:

- **Split-pane view** — Email list on the left, preview on the right. Resize the panels to your preference.
- **Smart classification** — AI automatically categorizes incoming emails with labels.
- **Natural language search** — Search your entire email history using everyday language, not just keywords.
- **Email preview** — Sanitized HTML rendering in an iframe for safe viewing.
- **Newsletter card view** — Special view for newsletter-type emails.
- **Swipeable rows** — Quick actions on desktop and mobile.
- **Unread count** — Badge shows unread count in the sidebar.

## Action Item Extraction

MyOpenBrain automatically extracts action items from your emails. When an email contains tasks, follow-ups, or commitments, the AI identifies them and creates action items with:

- Title and description
- Suggested assignee
- Inferred due date
- Priority level
- Link back to the source email

You can also manually create action items from any email by clicking "Create Action Item" in the email detail view.

## Email-to-Card Conversion

Any email can be turned into a Kanban card. Click the action menu on an email and select "Create Card." The card will be created on your email action board with the email context preserved.

## Email Encryption

MyOpenBrain encrypts sensitive email data at rest, including sender addresses, subject lines, and email body content. This ensures your communications remain private even at the database level.

## Troubleshooting Email Sync

If emails aren't syncing:
1. Check Settings > Integrations to verify your account shows as "Connected."
2. Try disconnecting and reconnecting the account.
3. Email sync uses webhook push notifications — it should be near-instant. If there's a delay, check your internet connection.
4. For Gmail, ensure you've granted the required permissions during OAuth.
5. For Outlook, Microsoft Graph webhooks may need to be renewed. The app handles this automatically, but network issues can occasionally cause missed renewals.`,
  },

  // ─────────────────────────────────────────────────────────
  // 3. Meeting Recording & Krisp
  // ─────────────────────────────────────────────────────────
  {
    label: "Meeting Recording & Transcription",
    content: `# Meeting Recording & Transcription

MyOpenBrain records and transcribes all your calls using a lightweight desktop application — no bots join your meetings.

## How the Desktop Recorder Works

Install the MyOpenBrain desktop app on your Windows PC. It runs silently in the background and automatically:

1. **Detects active calls** — Works with Zoom, Microsoft Teams, Google Meet, Slack Huddles, and even in-person conversations picked up by your microphone.
2. **Records audio locally** — The recording happens on your machine. No bot joins the meeting, and no one else knows it's running.
3. **Transcribes the conversation** — AI-powered speech-to-text converts the recording into a full transcript.
4. **Extracts key points** — The AI identifies and summarizes the most important points from each meeting.
5. **Identifies action items** — Commitments, follow-ups, and tasks are automatically extracted.
6. **Detects participants** — Speaker identification tracks who said what.

## Viewing Meetings

Navigate to Analytics (or the Krisp section) in the sidebar to access your meeting hub:

- **Search** — Use natural language queries to find meetings (e.g., "meetings about the Q3 budget").
- **Two view modes** — Switch between list view and card view.
- **Resizable panels** — Drag to resize the meeting list and detail panels. Layout persists between sessions.
- **Meeting detail drawer** — Click any meeting to see the full transcript, key points, action items, and participants.
- **Filters** — Filter by date range, speaker, duration, and more.
- **Keyboard shortcuts** — Use arrow keys to navigate between meetings.

## Meeting Metadata

Each meeting record includes:
- Meeting title
- Start and end timestamps
- Duration (in seconds)
- Speaker list with identification
- Participant list
- Key points with descriptions
- Full raw transcript content
- Event type classification

## Creating Cards from Meetings

You can create Kanban cards directly from meeting action items. In the meeting detail view, click on any action item to create a card linked to that meeting. This preserves the context of why the task was created.

## Meeting Analytics

The Analytics dashboard provides insights including:
- Meeting count over the last 30 days
- Average meeting duration
- Meeting frequency patterns
- Participant analytics

## Privacy

All recordings happen locally on your device. Transcripts are encrypted at rest in the database. Only you can access your meeting data thanks to row-level security policies.`,
  },

  // ─────────────────────────────────────────────────────────
  // 4. Kanban Board & Task Management
  // ─────────────────────────────────────────────────────────
  {
    label: "Kanban Boards & Task Management",
    content: `# Kanban Boards & Task Management

MyOpenBrain includes a full-featured Kanban board system for managing your tasks and projects.

## Creating and Managing Boards

- **Create a board** — Click the "+" button in the Boards section of the sidebar. Give it a name, optional description, and choose a background color.
- **Multiple boards** — The Focus plan supports up to 5 boards. The Second Brain plan offers unlimited boards.
- **Default board** — One board is set as your default and opens when you click "Boards" in the sidebar.
- **Board customization** — Each board can have its own background color and description.

## Columns

Columns represent stages in your workflow:

- **Create columns** — Add columns like "To Do," "In Progress," "Review," "Done."
- **Reorder columns** — Drag columns to rearrange their order.
- **Color-coded** — Each column can have its own color for visual distinction.
- **Focus column** — When a weekly plan is active, a special Focus column appears at the front of your board with a blue accent background. This column holds your hero priority cards and cannot be moved or deleted while a plan is active.

## Cards

Cards are your individual tasks. Each card supports:

- **Title and description** — Markdown-supported description for rich formatting.
- **Due dates** — Set deadlines with visual indicators (overdue cards show in red).
- **Priority levels** — Low, Medium, High, or Urgent priority.
- **Color labels** — Visual color coding for quick identification.
- **Checklists** — Add checklist items within a card to track sub-tasks.
- **Tags** — Organize cards with custom tags.
- **Drag-and-drop** — Move cards between columns by dragging.
- **Archive** — Archive completed cards to keep your board clean.

## Card Detail Drawer

Click any card to open the detail drawer where you can:
- Edit the title, description, and all card properties.
- View and manage checklist items.
- See linked meetings and action items.
- Set or change the due date and priority.
- Add color labels and tags.

## Snooze Feature

Cards can be "snoozed" — temporarily hidden and returned to their original column at a specified time. This is useful for tasks you want to deal with later without cluttering your active board.

## Hero Priorities & Focus Column

When you activate a weekly plan, your selected hero priority cards:
- Display a gold star badge and amber glow border.
- Are moved to the Focus column at the front of the board.
- The Focus column has a blue accent background and target icon.
- When the week ends or a new plan is activated, cards return to their original columns automatically.

## Creating Cards from Other Sources

Cards can be created from:
- **Emails** — Convert an email into a task card.
- **Meeting action items** — Create cards from extracted action items.
- **Calendar events** — Create a card from a calendar event.
- **AI suggestions** — The weekly planning AI can suggest cards as hero priorities.
- **Manual creation** — Click "+" in any column to create a card directly.

## Soft Delete & Recovery

Deleted cards are soft-deleted and can be recovered from the Trash section within the retention window.`,
  },

  // ─────────────────────────────────────────────────────────
  // 5. Brain Chat
  // ─────────────────────────────────────────────────────────
  {
    label: "Brain Chat — AI-Powered Search",
    content: `# Brain Chat — AI-Powered Search

Brain Chat is MyOpenBrain's conversational AI interface that lets you search across all your data using natural language. Available on the Second Brain plan.

## How It Works

Navigate to "Brain" in the sidebar to open Brain Chat. Type any question and the AI searches across:

- **Meetings** — Full transcripts, key points, and action items from your recorded calls.
- **Emails** — Your complete email history including sender, subject, and body content.
- **Decisions** — All tracked decisions with context and rationale.
- **Action Items** — Open and completed action items across meetings and emails.
- **Kanban Cards** — All your task cards including descriptions and checklists.
- **Brain Thoughts** — Your personal notes and ideas captured in the Brain.

## Example Queries

- "What did we decide about the Q3 budget in last week's meeting?"
- "Show me all action items assigned to Sarah."
- "What emails have I received about the Henderson contract?"
- "When was the last time we discussed the API migration?"
- "What are my overdue tasks?"
- "Summarize all meetings from this week."

## Source Attribution

Every AI response includes source badges indicating where the information came from (meetings, emails, decisions, action items, kanban, brain thoughts). Click on a source to navigate to the original item.

## Chat Sessions

Brain Chat supports multiple conversation sessions:
- **Create new sessions** — Start fresh conversations for different topics.
- **Load previous sessions** — Return to earlier conversations.
- **Delete sessions** — Clean up old conversations.
- **Sidebar navigation** — Browse sessions in the sidebar (responsive on mobile).

## Tips for Better Results

- Be specific with your queries — include names, dates, or topics.
- Use follow-up questions within the same session for contextual conversations.
- Press Shift+Enter for multi-line messages.
- The AI includes source links so you can always verify information against the original.

## Brain Thoughts

Brain Thoughts is a personal note-taking feature within Brain Chat:

- **Capture ideas** — Save thoughts, ideas, and notes at any time.
- **Link to data** — Connect thoughts to meetings, emails, or decisions.
- **Search** — Find thoughts using natural language.
- **Graph visualization** — See connections between your thoughts visualized as a graph.
- **Reminders** — Set reminders on thoughts to revisit them later.
- **Link recommendations** — The AI suggests relevant connections between your thoughts and other data.`,
  },

  // ─────────────────────────────────────────────────────────
  // 6. Weekly Planning & Reviews
  // ─────────────────────────────────────────────────────────
  {
    label: "Weekly Planning & Reviews",
    content: `# Weekly Planning & Reviews

MyOpenBrain's weekly planning system helps you stay organized with a structured ritual. Every week you follow a three-step flow: Assess, Review, and Plan. The entire session takes about 30 minutes.

## Step 1: Assess (Review Last Week)

The Assess tab shows your AI-generated end-of-week assessment:

- **Weekly Score (1-10)** — A weighted composite of four factors:
  - Hero priorities completion (40% weight)
  - Theme adherence (30% weight)
  - Action item closure (20% weight)
  - Reflection streak (10% weight)

- **Hero priorities status** — See which priorities were completed, in progress, or not started.
- **Per-day theme adherence** — How well you followed each day's theme (high, medium, low).
- **Highlights** — Your wins for the week.
- **Carry-forward items** — Suggestions for next week's priorities.
- **Personal reflection** — A free-text area where you can add your own thoughts about the week.

Saving your reflection marks the plan as fully assessed and contributes to your reflection streak. Reflecting for three or more consecutive weeks earns a 10% bonus on your weekly score.

## Step 2: Review (AI Synthesis)

The Review tab shows an AI-generated weekly synthesis including:

- **Topic clustering** — Groups related discussions across meetings and emails.
- **Cross-day pattern detection** — Identifies recurring themes throughout the week.
- **Unresolved action items** — Flags items that need attention.
- **Meeting/email/decision/action item aggregation** — Comprehensive data summary.

## Step 3: Plan (Set Up Next Week)

The Plan tab lets you configure the upcoming week:

### Hero Priorities
1. Click "Get AI Suggestions" — the AI analyzes your open cards (considering priorities, due dates, and carried-forward items) and pre-selects the top priorities.
2. Accept the suggestions or swap them for different cards.
3. When you confirm, selected cards are tagged as hero priorities and moved to the Focus column on your Kanban board.

### Daily Themes
The AI examines your calendar events, meeting schedule, hero priorities, and open tasks to suggest a theme for each day (Monday through Sunday). For example: Client Focus, Deep Build, Admin & Ops, Strategy, Creative, Learning, Recharge.

The AI avoids scheduling deep-work themes on days packed with meetings. You can override any theme by clicking on it.

### Curated Task Lists
For each themed day, the AI picks 5-7 tasks from your Kanban board that best match the theme. Hero priorities are always included on relevant days.

## Activating a Plan

Click "Confirm Plan" to activate. This:
- Creates the Focus column on your Kanban board.
- Moves hero priority cards to Focus with gold star badges.
- Sets daily themes visible in the board's theme banner.
- Triggers daily briefing emails with the day's theme and task list.

## Assessment Emails

Every Friday afternoon you receive an assessment email with your weekly score, hero priorities status, highlights, and a "Plan Next Week" button linking to the Reviews page.

## Score Trend

Over time, your weekly scores build into a visible trend. The Reviews list page shows a sparkline chart of your recent scores:
- Green (8-10): Great week
- Yellow (5-7): Solid effort
- Red (1-4): Room to grow

## Quick Start Checklist

1. Add cards to your Kanban board (these become your priority candidates).
2. Go to Reviews > Plan tab.
3. Click "Get AI Suggestions."
4. Review hero priorities and daily themes.
5. Click "Confirm Plan" to activate.
6. Check your daily briefing email each morning.
7. On Friday, check your assessment email, add your reflection, and plan the next week.`,
  },

  // ─────────────────────────────────────────────────────────
  // 7. Calendar
  // ─────────────────────────────────────────────────────────
  {
    label: "Calendar Integration",
    content: `# Calendar Integration

MyOpenBrain's calendar brings together events from all your connected accounts in one unified view.

## Connecting Calendar Accounts

Go to Settings > Integrations to connect:

- **Google Calendar** — Connect via Google OAuth. Syncs your events automatically.
- **Outlook / Microsoft 365** — Connect via Microsoft OAuth. Uses push subscriptions for real-time updates.

## Calendar Views

The calendar page offers four view modes:

- **Month View** — Traditional monthly calendar grid showing all events.
- **Week View** — Seven-day view with time slots for detailed scheduling.
- **Day View** — Single-day view with hour-by-hour timeline.
- **Agenda View** — Chronological list of upcoming events.

Switch between views using the buttons at the top of the calendar. The current view and date are persisted in the URL so you can bookmark or share specific views.

## Event Details

Click any event to see a popover with:
- Event subject/title
- Start and end times
- Location information
- Attendee list with RSVP status (accepted, declined, tentative)
- Organizer information
- Event body/description preview
- Link to original event (opens in Google Calendar or Outlook)

## Event Features

- **All-day events** — Displayed at the top of the day in all views.
- **Recurring events** — Detected and displayed correctly.
- **Cancellation status** — Cancelled events are visually distinguished.
- **Multi-account filtering** — Filter events by calendar account.
- **Color coding** — Events from different accounts have different colors.

## Creating Cards from Calendar Events

Click the action menu on any calendar event and select "Create Card" to turn it into a Kanban task card. This is useful for events that generate follow-up work.

## Calendar and Weekly Planning

Your calendar events directly inform the weekly planning AI:
- Daily themes consider your meeting load (no deep-work themes on heavy meeting days).
- The Upcoming Events widget on your dashboard shows the next 7 days.
- Calendar events appear in your weekly review synthesis.

## Troubleshooting Calendar Sync

If events aren't showing up:
1. Verify the account is connected in Settings > Integrations.
2. For Outlook, calendar sync uses push subscriptions that may need renewal.
3. Try disconnecting and reconnecting the calendar account.
4. Ensure you've granted the required calendar permissions during OAuth setup.`,
  },

  // ─────────────────────────────────────────────────────────
  // 8. Dashboard
  // ─────────────────────────────────────────────────────────
  {
    label: "Dashboard & Widgets",
    content: `# Dashboard & Widgets

Your MyOpenBrain dashboard is a customizable overview of everything happening in your productivity system.

## Available Widgets

The dashboard includes the following widgets, all draggable and rearrangeable:

- **Analytics Overview** — Week and month comparison with sparkline charts.
- **Activity Heatmap** — Visual representation of your activity patterns over time.
- **Daily Briefing** — AI-generated summary of what to focus on today, including today's theme (when a weekly plan is active), overdue cards, new emails, meetings, and action items due.
- **Upcoming Events** — Preview of your next 7 days of calendar events.
- **Overdue Cards** — Flagged incomplete tasks past their due date.
- **Recent Meetings** — Your last recorded calls.
- **Meeting Count** — 30-day meeting metrics.
- **Email Count** — 30-day email metrics.
- **Action Items Due** — Prioritized list of upcoming action items.

## Customizing Your Dashboard

- **Drag and drop** — Rearrange widgets by dragging them to new positions.
- **Layout persistence** — Your layout is saved automatically and restored when you return.

## Daily Briefing

The Daily Briefing widget provides a concise AI-generated summary including:
- Today's theme (if a weekly plan is active)
- Number of overdue cards
- New email count
- Meeting count for the day
- Action items due today
- Curated task list based on the day's theme

You can regenerate the daily briefing at any time by clicking the refresh button. The briefing is also sent to your email each morning.`,
  },

  // ─────────────────────────────────────────────────────────
  // 9. Decision Tracking
  // ─────────────────────────────────────────────────────────
  {
    label: "Decision Tracking & Register",
    content: `# Decision Tracking & Register

MyOpenBrain automatically captures and organizes decisions from your meetings and emails, creating a searchable decision register. Available on the Second Brain plan.

## How Decisions Are Captured

Decisions are automatically extracted from:

- **Meeting transcripts** — When the AI detects a decision being made during a recorded call, it creates a decision record linked to that meeting.
- **Email conversations** — Decisions communicated or confirmed via email are also captured.

## Decision Properties

Each decision record includes:

- **Decision statement** — What was decided.
- **Context and rationale** — Why the decision was made.
- **Participants** — Who was involved in making the decision.
- **Category** — Technical, Process, Budget, Strategic, or Other.
- **Status** — Active, Reconsidered, or Archived.
- **Priority level** — How important the decision is.
- **Confidence score** — How confident the AI is in the extraction.
- **Source attribution** — Link to the meeting or email where the decision was made.
- **Decision date** — When the decision was made.
- **User annotations** — Your own notes and context.

## Managing Decisions

- **Search** — Find decisions using natural language in Brain Chat (e.g., "What did we decide about the API migration?").
- **Status management** — Mark decisions as reconsidered or archived as circumstances change.
- **Annotations** — Add your own context and notes to any decision.
- **Soft delete** — Decisions can be soft-deleted and recovered from Trash.

## Why Decision Tracking Matters

Over time, it becomes hard to remember what was decided, when, and why. The decision register gives you a searchable history with full context. When someone asks "Why did we choose option B?", you can find the answer instantly — complete with the meeting recording and email thread where it was discussed.`,
  },

  // ─────────────────────────────────────────────────────────
  // 10. Smart Labels
  // ─────────────────────────────────────────────────────────
  {
    label: "Smart Labels & Email Rules",
    content: `# Smart Labels & Email Rules

Smart Labels are AI-powered rules that automatically classify and organize your incoming emails.

## How Smart Labels Work

When a new email arrives, MyOpenBrain's AI evaluates it against your smart label rules and automatically applies matching labels. This happens in real-time as emails are received.

## Creating Smart Label Rules

Go to Settings > Smart Labels to create and manage rules:

1. **Name your rule** — Give it a descriptive name (e.g., "Client Invoices," "Team Updates").
2. **Set conditions** — Define when the rule should trigger based on:
   - Sender address or domain
   - Subject line keywords
   - Email body content
   - Combination of conditions
3. **Choose the action** — What happens when the rule matches:
   - Apply a label
   - Move to a specific folder
   - Create a Kanban card automatically
4. **Test the rule** — Preview which existing emails match before activating.

## AI Classification

Beyond manual rules, MyOpenBrain's AI automatically classifies emails into categories:
- Important communications
- Newsletters and subscriptions
- Notifications
- Action required
- FYI/informational

## Folder Syncing

Smart labels can be linked to folders in your email provider (Gmail labels or Outlook folders), keeping your email organization consistent across MyOpenBrain and your native email client.

## Managing Rules

- **Edit** — Update conditions and actions at any time.
- **Enable/Disable** — Toggle rules on and off without deleting them.
- **Delete** — Remove rules you no longer need.
- **Priority** — Rules are evaluated in order; higher-priority rules take precedence.`,
  },

  // ─────────────────────────────────────────────────────────
  // 11. Workspace & Pages
  // ─────────────────────────────────────────────────────────
  {
    label: "Workspace & Pages",
    content: `# Workspace & Pages

MyOpenBrain includes a Notion-like document system for creating rich pages, capturing knowledge, and organizing information.

## Workspaces

- **Create workspaces** — Organize your pages into separate workspaces for different projects or areas of life.
- **Automatic creation** — Your first workspace is created automatically when you sign up.
- **Multiple workspaces** — Create as many as you need.

## Pages

Pages are rich documents that support:

### Content Blocks
- **Paragraphs** — Standard text content.
- **Headings** — H1, H2, and H3 for document structure.
- **Bulleted lists** — Unordered list items.
- **Numbered lists** — Ordered list items.
- **Checkboxes / To-do items** — Interactive checkboxes.
- **Toggle blocks** — Collapsible content sections.
- **Code blocks** — Syntax-highlighted code.
- **Quotes** — Block quotes for emphasis.
- **Dividers** — Visual separators.
- **Callouts** — Highlighted information boxes.
- **Images** — Embed images in your pages.
- **Bookmarks** — Save and display web links.

### Page Properties
- **Custom icons** — Choose an icon for each page.
- **Cover images** — Add a cover image to the top of the page.
- **Page types** — Page, Knowledge, or Decisions.
- **Color coding** — Color-code pages for visual organization.
- **Hierarchical structure** — Create parent/child page relationships.

### Page Entries
Pages can contain special entries:
- **Knowledge entries** — Manually added or auto-populated knowledge.
- **Decision entries** — Linked decisions from the decision register.
- **Email summary entries** — Summaries of relevant emails.
- **Source attribution** — Track where each entry came from.

### Database Pages
Special page type that functions like a table/board:
- **Custom properties** — Text, number, select, multi-select, date, checkbox, URL.
- **Multiple views** — View data as a table or board.
- **Grouping and filtering** — Organize data by properties.
- **Sorting** — Order entries by any property.

## Organization

- **Archive** — Archive pages you no longer need actively.
- **Sort order** — Drag pages to reorder them.
- **Search** — Full-text search across all pages.`,
  },

  // ─────────────────────────────────────────────────────────
  // 12. Activity Log
  // ─────────────────────────────────────────────────────────
  {
    label: "Activity Log",
    content: `# Activity Log

The Activity page provides a complete history of everything happening in your MyOpenBrain account.

## Accessing the Activity Log

Navigate to "Activity" in the sidebar to view your complete action history.

## Event Categories

The activity log tracks events across all features:

- **Email events** — Received, sent, classified, draft created, draft sent, labeled.
- **Smart label events** — Rule triggered, created, updated, folder synced.
- **Card events** — Created, moved between columns, completed, deleted.
- **Board events** — Board created.
- **Decision events** — Decision created, status changed.
- **Action item events** — Created, completed.
- **Thought events** — Created, linked, reminder sent.
- **Page events** — Created, updated.
- **Meeting events** — Recorded, transcribed.
- **Calendar events** — Synced, updated.
- **Integration events** — Connected, disconnected, synced.
- **Review events** — Weekly review completed, daily briefing generated.

## Filtering

Filter the activity log by category to focus on specific types of events. Click the filter buttons at the top to show only the events you're interested in.

## Event Details

Each event shows:
- **Timestamp** — When the event occurred.
- **Event type** — What happened (with color-coded icon).
- **Description** — Details about the event.
- **Entity link** — Click to navigate to the related item (email, card, meeting, etc.).
- **Metadata** — Additional context about the event.

## Use Cases

The activity log is useful for:
- Tracking what happened while you were away.
- Auditing changes to important items.
- Understanding your productivity patterns.
- Debugging integration issues (seeing when syncs happened).`,
  },

  // ─────────────────────────────────────────────────────────
  // 13. Settings & Account
  // ─────────────────────────────────────────────────────────
  {
    label: "Settings & Account Management",
    content: `# Settings & Account Management

Access Settings from the sidebar to manage your account, integrations, and preferences.

## Account Settings

- **Profile information** — Update your display name.
- **Avatar** — Upload or change your profile picture.
- **Account deletion** — Delete your account and all associated data. You can export your data before deletion.

## Integrations

Manage all your connected services:

### Email
- **Gmail** — Connect/disconnect, view sync status.
- **Outlook** — Connect/disconnect, manage webhook subscriptions.

### Calendar
- **Google Calendar** — View and sync events.
- **Outlook Calendar** — View and sync events with push subscription support.

### Meeting
- **Zoom** — Connect for meeting transcription webhooks.
- **Krisp** — View integration status.

### Integration Status
Each integration shows:
- Connection status (connected/disconnected)
- Last sync timestamp
- Any error messages

## Smart Labels

Create and manage AI-powered email classification rules. See the "Smart Labels & Email Rules" article for details.

## Extensions

Manage browser extensions and the desktop recording app:
- View installed extensions.
- Check for updates.
- Configure extension settings.

## Pages/Workspace Settings

Configure your workspace and page organization preferences.

## Prompts

Customize AI behavior and prompts. The Second Brain plan allows you to configure custom AI prompts for different features.

## Subscriptions

Manage your subscription plan, view billing information, and change or cancel your plan. See the "Billing & Subscriptions" article for details.`,
  },

  // ─────────────────────────────────────────────────────────
  // 14. Billing & Subscriptions
  // ─────────────────────────────────────────────────────────
  {
    label: "Billing & Subscriptions",
    content: `# Billing & Subscriptions

MyOpenBrain offers two paid plans plus a generous trial period. Billing is handled securely through Stripe.

## Plans

### Trial (14 days)
- Full access to the Second Brain plan features.
- No credit card required to start.
- If you don't save at least 3 hours in your first week, cancel with no questions asked.

### Focus Plan — $19/month ($149/year)
Get organized — email + meetings in one place:
- 500 Open Brain captures per month
- 1 email account
- Up to 5 Kanban boards
- Unlimited cards
- Meeting recording & transcription
- Email classification & action items
- Basic weekly briefing
- Email support

### Second Brain Plan — $39/month ($349/year)
Your complete work intelligence system:
- Unlimited Open Brain captures
- Up to 3 email accounts
- Unlimited Kanban boards & cards
- Brain Chat — AI search across everything
- Decision Register with full context
- Full AI-powered weekly briefing with synthesis
- Daily briefing emails
- Full MCP read/write access
- Priority support
- Early access to new features

## Founder's Pricing

Early adopters get Founder's Pricing — your subscription rate is locked in for life, even as features are added and prices increase. Once you subscribe at today's rate, your price never goes up as long as your subscription stays active.

## After Trial Expires

When your 14-day trial ends without a subscription:
- You retain read-only access to existing data.
- Limited to 1 Kanban board (read-only).
- 10 Open Brain captures per month.
- No email integrations.
- No AI features, Brain Chat, or Decision Register.
- No weekly or daily briefings.

## Managing Your Subscription

Go to Settings > Billing (or Settings > Subscriptions) to:
- View your current plan and billing cycle.
- See billing history and invoices.
- Change your plan (upgrade or downgrade).
- Cancel your subscription.
- Switch between monthly and annual billing.

## Payment Methods

Payments are processed securely through Stripe. You can pay with:
- Credit card
- Debit card

## Annual vs Monthly

Save money by choosing annual billing:
- Focus: $149/year ($12.42/month) vs $19/month
- Second Brain: $349/year ($29.08/month) vs $39/month

## "3 Hours Back" Guarantee

If you don't save at least 3 hours in your first week, cancel anytime with no questions asked. Our average user saves 3+ hours per week on email and meeting overhead.`,
  },

  // ─────────────────────────────────────────────────────────
  // 15. Security & Privacy
  // ─────────────────────────────────────────────────────────
  {
    label: "Security & Data Privacy",
    content: `# Security & Data Privacy

MyOpenBrain takes the security and privacy of your data seriously.

## Encryption

### At Rest
Your data is encrypted at rest using AES-256 encryption. Sensitive fields are individually encrypted including:
- Email sender addresses
- Email subject lines
- Email body content
- Card descriptions
- Action item titles
- Calendar event details
- Daily briefing content

### In Transit
All data transmitted between your browser and our servers is encrypted using TLS 1.3.

## Row-Level Security (RLS)

MyOpenBrain uses PostgreSQL Row-Level Security policies to ensure that only you can access your data, even at the database level. This means:

- Every database query is automatically filtered to show only your data.
- Even if there were a software bug, you would never see another user's data.
- RLS is enforced by the database itself, not just the application code.
- JWT-based authentication (pg_session_jwt extension) verifies your identity for every query.

## Authentication

- **Email/password** — Standard signup with secure password hashing.
- **Google OAuth** — Sign in with your Google account for convenience and security.
- **Session management** — Sessions are managed with secure, HTTP-only cookies.
- **JWT tokens** — Authentication tokens are short-lived and securely signed.

## AI and Your Data

- **We never use your data to train AI models.** Your meetings, emails, and documents are used only to provide features to you.
- **Source attribution** — Every AI-generated insight includes links to the source material so you can verify it.
- **AI processing** — AI features use secure API calls to process your data. No data is stored by AI providers.

## Data Ownership

- **Your data is yours.** You can export all your data at any time in standard formats.
- **Account deletion** — You can delete your account and all associated data at any time from Settings > Account.
- **No lock-in** — If you cancel, your data remains accessible in read-only mode until you choose to delete it.

## Webhook Security

All webhook endpoints (for email sync, calendar sync, and payment processing) use signature verification:
- **Stripe** — Webhook signature verification using your Stripe webhook secret.
- **Microsoft Graph** — Subscription validation and lifecycle notification handling.
- **Google** — Push notification validation.
- **Zoom** — Webhook event verification.

## Infrastructure

MyOpenBrain is hosted on modern cloud infrastructure with:
- Automated backups
- DDoS protection
- Monitoring and alerting
- Regular security audits`,
  },

  // ─────────────────────────────────────────────────────────
  // 16. Trash & Recovery
  // ─────────────────────────────────────────────────────────
  {
    label: "Trash & Data Recovery",
    content: `# Trash & Data Recovery

MyOpenBrain uses soft deletion — when you delete something, it's not immediately destroyed. Instead, it moves to Trash where you can recover it.

## Accessing Trash

Navigate to "Trash" in the sidebar to view all soft-deleted items.

## Recoverable Items

The following item types can be recovered from Trash:

- **Cards** — Deleted Kanban task cards.
- **Action Items** — Deleted action items from meetings or emails.
- **Emails** — Removed email records.
- **Meetings** — Deleted meeting recordings.
- **Decisions** — Archived or deleted decisions.
- **Pages** — Deleted workspace pages.

## Trash Information

Each item in Trash shows:
- **Item type and title** — What was deleted.
- **Deletion timestamp** — When it was deleted.
- **Days remaining** — How many days before permanent deletion.
- **Original location** — Where the item was before deletion (e.g., which board/column for cards).

## Actions

- **Restore** — Click the restore button to return an item to its original location.
- **Permanent delete** — Click the permanent delete button to immediately and irreversibly remove the item.

## Retention Period

Items remain in Trash for a set retention period before being permanently deleted. Check the "days remaining" indicator on each item to see how long you have to recover it.

## Tips

- Check Trash before assuming data is lost — it's probably still recoverable.
- If you accidentally delete something important, restore it immediately to avoid it being permanently removed.
- Regularly clean up Trash by permanently deleting items you're sure you don't need.`,
  },

  // ─────────────────────────────────────────────────────────
  // 17. Contacts
  // ─────────────────────────────────────────────────────────
  {
    label: "Contacts Management",
    content: `# Contacts Management

MyOpenBrain automatically builds a contact list from your email history, giving you insights into your communication patterns.

## Accessing Contacts

Navigate to "Contacts" in the sidebar to view your aggregated contact list.

## Features

- **Automatic extraction** — Contacts are automatically extracted from your email history. No manual entry needed.
- **Search and filter** — Find contacts by name or email address.
- **Pagination** — Browse through large contact lists with pagination controls.

## Contact Details

Click on any contact to see:

- **Contact information** — Name and email address.
- **Recent emails** — The most recent emails exchanged with this contact.
- **Email statistics** — How many emails you've sent and received with this person.
- **Communication frequency** — How often you communicate with this contact.

## Refreshing Contacts

Click the refresh button to manually re-scan your email history and update the contact list. This is useful after connecting a new email account or if you notice missing contacts.

## Use Cases

- Quickly find the email address of someone you've communicated with.
- See your most frequent contacts at a glance.
- Access recent email history with any contact.
- Understand your communication patterns.`,
  },

  // ─────────────────────────────────────────────────────────
  // 18. Integrations Setup Guide
  // ─────────────────────────────────────────────────────────
  {
    label: "Setting Up Integrations — Gmail, Outlook, Zoom",
    content: `# Setting Up Integrations

MyOpenBrain connects to your existing tools for email, calendar, and meetings. Here's how to set up each integration.

## Gmail Integration

### Connecting Gmail
1. Go to Settings > Integrations.
2. Find the Gmail section and click "Connect Gmail."
3. You'll be redirected to Google's OAuth consent screen.
4. Sign in with your Google account and grant the requested permissions.
5. You'll be redirected back to MyOpenBrain.
6. Your Gmail emails will begin syncing automatically.

### What Gmail Access Includes
- Reading and syncing your email messages.
- Push notifications for real-time new email alerts.
- Label synchronization with smart labels.

### Gmail Troubleshooting
- If sync stops, check that your Google account still has the permissions granted.
- Try disconnecting and reconnecting from Settings > Integrations.
- Ensure pop-up blockers aren't preventing the OAuth redirect.

## Outlook / Microsoft 365 Integration

### Connecting Outlook
1. Go to Settings > Integrations.
2. Find the Outlook section and click "Connect Outlook."
3. You'll be redirected to Microsoft's OAuth consent screen.
4. Sign in with your Microsoft account and grant permissions.
5. You'll be redirected back to MyOpenBrain.
6. Email and calendar syncing begins automatically via Microsoft Graph API.

### What Outlook Access Includes
- Email reading and syncing via Microsoft Graph.
- Calendar event syncing with push subscriptions.
- Real-time webhook notifications for new emails and events.

### Outlook Troubleshooting
- Microsoft Graph webhook subscriptions expire periodically. MyOpenBrain handles renewal automatically, but network issues can occasionally cause a missed renewal.
- If sync seems delayed, try disconnecting and reconnecting.
- For Microsoft 365 accounts with admin restrictions, your IT admin may need to approve the OAuth application.

## Zoom Integration

### Connecting Zoom
1. Go to Settings > Integrations.
2. Find the Zoom section and click "Connect Zoom."
3. Authorize MyOpenBrain through Zoom's OAuth flow.
4. Meeting transcription webhooks will be configured automatically.

### What Zoom Access Includes
- Meeting transcription via webhooks.
- Recording processing and key point extraction.
- Integration with the meeting hub.

## Checking Integration Status

The Integration Status dashboard in Settings shows:
- Which accounts are connected.
- Connection status (active/error).
- Last successful sync timestamp.
- Any error messages that need attention.

## Plan Limits

- **Focus plan**: 1 email account.
- **Second Brain plan**: Up to 3 email accounts.
- Calendar and Zoom integrations are available on both paid plans.`,
  },

  // ─────────────────────────────────────────────────────────
  // 19. Troubleshooting & FAQ
  // ─────────────────────────────────────────────────────────
  {
    label: "Troubleshooting & Frequently Asked Questions",
    content: `# Troubleshooting & Frequently Asked Questions

## Common Issues

### Emails aren't syncing
1. Check Settings > Integrations to verify your email account shows as "Connected."
2. Try disconnecting and reconnecting the account.
3. For Gmail, ensure you've granted all required permissions during OAuth.
4. For Outlook, webhook subscriptions may need renewal — reconnecting usually fixes this.
5. Check your internet connection.

### Meetings aren't being recorded
1. Ensure the MyOpenBrain desktop app is running (check your system tray).
2. Verify the app has microphone permissions on your computer.
3. Check that you're on a call platform the app supports (Zoom, Teams, Meet, Slack, or in-person via microphone).
4. Restart the desktop app if it seems unresponsive.

### Calendar events aren't showing
1. Verify the calendar account is connected in Settings > Integrations.
2. For Outlook, try disconnecting and reconnecting to renew push subscriptions.
3. For Google Calendar, ensure calendar read permissions were granted during OAuth.
4. Check the calendar filter — you may have filtered out the account's events.

### Weekly plan isn't generating
1. Make sure you have cards on your Kanban board — the AI needs tasks to suggest as priorities.
2. Check your subscription plan — weekly planning features require at least the Focus plan.
3. If the AI suggestions aren't loading, try refreshing the page and clicking "Get AI Suggestions" again.

### Brain Chat isn't responding
1. Brain Chat requires the Second Brain plan.
2. If responses are slow, the AI may be processing a large amount of data.
3. Try starting a new chat session if the current one seems stuck.
4. Check for any error messages in the chat interface.

### Cards or data seem missing
1. Check the Trash — items may have been soft-deleted and are recoverable.
2. Make sure you're looking at the correct board.
3. Use the search function to find items across all boards and sources.

## Frequently Asked Questions

### How does the desktop recorder work?
The MyOpenBrain desktop app runs silently on your Windows PC. It automatically detects and records calls on Zoom, Teams, Meet, Slack, and even in-person conversations. No bots join your meetings, and no one else knows it's running.

### Is my data private and secure?
Yes. Your data is encrypted at rest (AES-256) and in transit (TLS 1.3). We never use your data to train AI models. Row-level security ensures only you can access your data. You can export or delete everything at any time.

### What does the 14-day trial include?
Full access to the Second Brain plan — unlimited captures, Brain Chat, Decision Register, email management, weekly briefings, and everything else. No credit card required.

### What's the "3 Hours Back" Guarantee?
If you don't save at least 3 hours in your first week, cancel anytime — no questions asked. Our average user saves 3+ hours per week.

### How much does it cost?
Focus plan: $19/month ($149/year) for email + meetings basics. Second Brain: $39/month ($349/year) for the full intelligence system. Both include a 14-day free trial. Founder's Pricing locks in your rate for life.

### How is this different from other productivity tools?
MyOpenBrain unifies six tools in one — meeting recorder, email manager, AI search, decision tracker, task board, and weekly briefings — for $39/month. Your meeting transcript connects to the email thread, the decisions made, and the action items that followed. No other tool gives you that cross-source context.

### What is Founder's Pricing?
Early adopters lock in current pricing for life, even as features and prices change. Once you subscribe, your price never goes up as long as your subscription stays active.

### How accurate is the AI?
Our AI uses state-of-the-art models for transcription and extraction. Every AI-generated insight includes source attribution so you can verify it against the original.

### How long does setup take?
Most users are up and running in under 5 minutes. Install the desktop app, connect your email, and MyOpenBrain starts working immediately.

### Can I export my data?
Yes. Your data is yours. Export anytime from Settings > Account in standard formats.

### Does my whole team need to use it?
No. MyOpenBrain works for individuals. It captures what comes through your machine and your inbox — no team-wide rollout needed.

## Getting Help

If you can't resolve an issue:
- Use the support chat widget in the bottom-right corner of the app.
- Email support is available for Focus plan subscribers.
- Priority support is available for Second Brain plan subscribers.`,
  },

  // ─────────────────────────────────────────────────────────
  // 20. Action Items
  // ─────────────────────────────────────────────────────────
  {
    label: "Action Items & Task Automation",
    content: `# Action Items & Task Automation

MyOpenBrain automatically identifies and tracks action items from your meetings and emails.

## Automatic Extraction

When you record a meeting or receive an email, MyOpenBrain's AI scans the content and extracts action items — tasks, follow-ups, commitments, and deadlines mentioned in the conversation.

### From Meetings
The AI identifies statements like:
- "I'll send the report by Friday."
- "Can you follow up with the client?"
- "Let's schedule a review for next week."

Each becomes an action item linked to the specific meeting.

### From Emails
Similarly, emails containing action-oriented language are scanned and action items are extracted automatically.

## Action Item Properties

Each action item includes:
- **Title** — Brief description of the task.
- **Description** — Additional context and details.
- **Assignee** — Who is responsible (if identified).
- **Due date** — When it needs to be done (if mentioned or inferred).
- **Priority** — Low, Medium, High, or Urgent.
- **Status** — Open, In Progress, Completed, or Cancelled.
- **Source link** — Direct link to the meeting or email where the action item originated.

## Managing Action Items

- **View** — Action items appear in multiple places: the Dashboard widget, meeting details, email details, and Brain Chat queries.
- **Update status** — Change status as you work on items (Open > In Progress > Completed).
- **Edit** — Modify the title, description, due date, or priority.
- **Convert to card** — Turn an action item into a Kanban card for your board.
- **Complete** — Mark as done to track completion dates.
- **Cancel** — Mark as cancelled if no longer needed.
- **Delete** — Soft delete (recoverable from Trash).

## Action Items in Weekly Planning

Action items play a role in the weekly planning system:
- **Assessment** — Action item closure rate contributes 20% to your weekly score.
- **Review** — Unresolved action items are flagged in the weekly synthesis.
- **Planning** — The AI considers open action items when suggesting hero priorities.

## Reminders

You can set reminders on action items to be notified when they're due.

## Bulk Creation

From any meeting detail view, you can bulk-create cards from all extracted action items at once, sending them to your Kanban board for tracking.`,
  },
];

// ── Runner ────────────────────────────────────────────────

async function main() {
  console.log(`Seeding ${articles.length} knowledge-base articles...\n`);

  for (let i = 0; i < articles.length; i++) {
    const article = articles[i];
    console.log(
      `[${i + 1}/${articles.length}] Ingesting: ${article.label} ...`
    );
    try {
      const sourceId = await ingestText(article.content, article.label);
      console.log(`  ✓ Source ID: ${sourceId}`);
    } catch (err) {
      console.error(`  ✗ Error:`, err);
    }
  }

  console.log("\nDone! All articles have been submitted for ingestion.");
  process.exit(0);
}

main();
