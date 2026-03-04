# Notion-Like MVP — Technical Specification

## Overview

Build a lightweight, self-contained Notion-like workspace app called **"Pages"**. The MVP focuses on three core primitives that make Notion powerful: **pages**, **blocks**, and **databases**. The app should feel fast, minimal, and keyboard-friendly.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15+ (App Router) |
| Language | TypeScript (strict mode) |
| Database | PostgreSQL (via Neon serverless or local Postgres) |
| ORM | Drizzle ORM |
| Auth | NextAuth 5 (Credentials provider, JWT sessions) |
| Styling | Tailwind CSS 4 |
| State | React 19 (useState/useReducer for local; SWR or React Query for server) |
| Rich Text | TipTap (ProseMirror-based) or custom block editor |
| Icons | Lucide React |
| Drag & Drop | @dnd-kit/core |

---

## Data Model

### Tables

#### `users`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK, default `gen_random_uuid()` |
| email | varchar(255) | unique, not null |
| name | varchar(255) | not null |
| password_hash | varchar(255) | not null |
| avatar_url | text | nullable |
| created_at | timestamp | default `now()` |
| updated_at | timestamp | default `now()` |

#### `workspaces`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| name | varchar(255) | not null |
| owner_id | uuid | FK → users.id |
| created_at | timestamp | default `now()` |

#### `pages`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| workspace_id | uuid | FK → workspaces.id, not null |
| parent_id | uuid | FK → pages.id, nullable (for nesting) |
| title | varchar(500) | default `''` |
| icon | varchar(50) | nullable (emoji or icon name) |
| cover_url | text | nullable |
| is_database | boolean | default `false` |
| database_config | jsonb | nullable (see Database Config section) |
| is_archived | boolean | default `false` |
| created_by | uuid | FK → users.id |
| sort_order | integer | for ordering among siblings |
| created_at | timestamp | default `now()` |
| updated_at | timestamp | default `now()` |

**Indexes:** `(workspace_id, parent_id, sort_order)`, `(workspace_id, is_archived)`

#### `blocks`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| page_id | uuid | FK → pages.id, not null, on delete cascade |
| parent_block_id | uuid | FK → blocks.id, nullable (for nested blocks) |
| type | varchar(50) | not null (see Block Types) |
| content | jsonb | not null, default `{}` |
| sort_order | integer | position within parent |
| created_at | timestamp | default `now()` |
| updated_at | timestamp | default `now()` |

**Indexes:** `(page_id, parent_block_id, sort_order)`

#### `database_rows`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| database_page_id | uuid | FK → pages.id (the page with `is_database=true`) |
| properties | jsonb | not null, default `{}` (key-value map of property values) |
| sort_order | integer | manual sort position |
| created_at | timestamp | default `now()` |
| updated_at | timestamp | default `now()` |

**Indexes:** `(database_page_id, sort_order)`

Each database row is also linked to a page (the row *is* a page that can contain blocks). Add a `row_page_id` column (FK → pages.id) to allow opening a row as a full page with its own blocks.

---

## Block Types

The `blocks.type` field accepts these values. The `blocks.content` JSONB stores type-specific data.

| Type | `content` shape | Description |
|------|----------------|-------------|
| `paragraph` | `{ "text": "<rich text>" }` | Standard text block |
| `heading_1` | `{ "text": "<rich text>" }` | H1 heading |
| `heading_2` | `{ "text": "<rich text>" }` | H2 heading |
| `heading_3` | `{ "text": "<rich text>" }` | H3 heading |
| `bulleted_list` | `{ "text": "<rich text>" }` | Bulleted list item |
| `numbered_list` | `{ "text": "<rich text>" }` | Numbered list item |
| `to_do` | `{ "text": "<rich text>", "checked": false }` | Checkbox item |
| `toggle` | `{ "text": "<rich text>" }` | Collapsible toggle (children are nested blocks) |
| `code` | `{ "text": "<plain text>", "language": "javascript" }` | Code block |
| `quote` | `{ "text": "<rich text>" }` | Block quote |
| `divider` | `{}` | Horizontal rule |
| `callout` | `{ "text": "<rich text>", "icon": "💡" }` | Callout box |
| `image` | `{ "url": "<url>", "caption": "<text>" }` | Image embed |
| `bookmark` | `{ "url": "<url>", "title": "<text>", "description": "<text>" }` | URL bookmark |

### Rich Text Format

Rich text is stored as a JSON array of segments:

```json
[
  { "text": "Hello ", "bold": false, "italic": false },
  { "text": "world", "bold": true, "italic": false, "code": true },
  { "text": "!", "bold": false, "italic": false }
]
```

Supported marks: `bold`, `italic`, `underline`, `strikethrough`, `code`, `link` (with `href` field).

---

## Database Config

When `pages.is_database = true`, the `database_config` JSONB stores:

```json
{
  "properties": [
    { "id": "prop_1", "name": "Status", "type": "select", "options": [
      { "id": "opt_1", "name": "Not Started", "color": "gray" },
      { "id": "opt_2", "name": "In Progress", "color": "blue" },
      { "id": "opt_3", "name": "Done", "color": "green" }
    ]},
    { "id": "prop_2", "name": "Priority", "type": "select", "options": [
      { "id": "opt_4", "name": "High", "color": "red" },
      { "id": "opt_5", "name": "Medium", "color": "yellow" },
      { "id": "opt_6", "name": "Low", "color": "gray" }
    ]},
    { "id": "prop_3", "name": "Due Date", "type": "date", "options": [] },
    { "id": "prop_4", "name": "Assignee", "type": "text", "options": [] },
    { "id": "prop_5", "name": "Tags", "type": "multi_select", "options": [] }
  ],
  "views": [
    { "id": "view_1", "name": "Table", "type": "table", "filters": [], "sorts": [] },
    { "id": "view_2", "name": "Board", "type": "board", "group_by": "prop_1", "filters": [], "sorts": [] }
  ]
}
```

### Property Types for MVP

| Type | Value stored in `database_rows.properties` |
|------|-------------------------------------------|
| `text` | `"string value"` |
| `number` | `123` |
| `select` | `"option_id"` |
| `multi_select` | `["option_id_1", "option_id_2"]` |
| `date` | `"2025-01-15"` or `{ "start": "2025-01-15", "end": "2025-01-20" }` |
| `checkbox` | `true` / `false` |
| `url` | `"https://..."` |

---

## API Routes

All routes under `/api/`. All require authentication (NextAuth session). Return JSON. Use standard HTTP status codes.

### Auth
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/auth/register` | Create account (email, name, password). Hash with bcrypt. Create default workspace. |
| * | `/api/auth/[...nextauth]` | NextAuth handler (login, session, etc.) |

### Workspaces
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/workspaces` | List user's workspaces |
| POST | `/api/workspaces` | Create workspace |

### Pages
| Method | Route | Body / Params | Description |
|--------|-------|--------------|-------------|
| GET | `/api/pages?workspace_id=X` | query: `workspace_id` | List all non-archived pages (flat list, client builds tree from `parent_id`) |
| POST | `/api/pages` | `{ workspace_id, parent_id?, title?, icon?, is_database? }` | Create page |
| GET | `/api/pages/[id]` | — | Get page with all its blocks (ordered by sort_order) |
| PATCH | `/api/pages/[id]` | `{ title?, icon?, cover_url?, parent_id?, sort_order?, is_archived? }` | Update page metadata |
| DELETE | `/api/pages/[id]` | — | Hard delete page and all child pages/blocks (cascade) |

### Blocks
| Method | Route | Body | Description |
|--------|-------|------|-------------|
| POST | `/api/pages/[pageId]/blocks` | `{ type, content, parent_block_id?, sort_order }` | Create block |
| PATCH | `/api/blocks/[id]` | `{ content?, type?, sort_order?, parent_block_id? }` | Update block |
| DELETE | `/api/blocks/[id]` | — | Delete block and children |
| POST | `/api/pages/[pageId]/blocks/reorder` | `{ blocks: [{ id, sort_order, parent_block_id }] }` | Batch reorder blocks |

### Database Rows
| Method | Route | Body / Params | Description |
|--------|-------|--------------|-------------|
| GET | `/api/databases/[pageId]/rows` | query: `filters?`, `sorts?`, `view_id?` | List rows with optional filtering/sorting |
| POST | `/api/databases/[pageId]/rows` | `{ properties }` | Create row (also creates a linked page) |
| PATCH | `/api/databases/[pageId]/rows/[rowId]` | `{ properties }` | Update row properties |
| DELETE | `/api/databases/[pageId]/rows/[rowId]` | — | Delete row and linked page |
| PATCH | `/api/databases/[pageId]/config` | `{ properties?, views? }` | Update database schema/views |

---

## Frontend Routes & Pages

```
/                           → Redirect to /workspace/[default_workspace_id]
/login                      → Login form
/register                   → Registration form
/workspace/[workspaceId]    → Main app shell (sidebar + content area)
/workspace/[workspaceId]/[pageId]  → View/edit a specific page
```

---

## UI Components

### App Shell (`/workspace/[workspaceId]` layout)

```
┌──────────────────────────────────────────────────┐
│ Sidebar (260px, collapsible)  │  Content Area     │
│                               │                   │
│  [Workspace Name]             │  [Page Title]     │
│  ─────────────────            │  [Block 1]        │
│  🔍 Quick Find               │  [Block 2]        │
│  📄 Page 1                   │  [Block 3]        │
│    📄 Nested Page            │  ...              │
│  📊 Database 1               │                   │
│  📄 Page 2                   │                   │
│  ─────────────────            │                   │
│  + New Page                   │                   │
│  🗑️ Trash                    │                   │
└──────────────────────────────────────────────────┘
```

### Component Tree

```
AppShell
├── Sidebar
│   ├── WorkspaceHeader (name, settings dropdown)
│   ├── QuickFind (Cmd+K search dialog)
│   ├── PageTree (recursive, drag-to-reorder, drag-to-nest)
│   │   └── PageTreeItem (icon, title, expand/collapse, context menu)
│   ├── NewPageButton
│   └── TrashSection (list archived pages, restore/delete)
│
├── ContentArea
│   ├── PageHeader
│   │   ├── IconPicker (click icon to change)
│   │   ├── CoverImage (optional, click to change)
│   │   └── TitleInput (inline editable, large text)
│   │
│   ├── BlockEditor (if not a database page)
│   │   ├── Block (recursive for nested blocks)
│   │   │   ├── BlockHandle (drag handle, appears on hover)
│   │   │   ├── BlockContent (renders based on type)
│   │   │   └── BlockMenu (slash command menu, appears on "/" key)
│   │   └── AddBlockButton (appears at bottom, or between blocks on hover)
│   │
│   └── DatabaseView (if is_database page)
│       ├── ViewTabs (Table | Board | toggle between views)
│       ├── FilterBar (add/remove filters)
│       ├── SortBar (add/remove sorts)
│       ├── TableView
│       │   ├── TableHeader (column names, click to sort, drag to resize)
│       │   └── TableRow (inline-editable cells)
│       ├── BoardView
│       │   ├── BoardColumn (grouped by select property)
│       │   └── BoardCard (drag between columns)
│       └── NewRowButton
│
└── Modals/Overlays
    ├── QuickFindDialog (Cmd+K)
    ├── SlashCommandMenu (block type selector)
    ├── EmojiPicker (for page icons)
    └── RowDetailModal (open database row as page)
```

---

## Block Editor Behavior

This is the core of the app. It must feel fast and intuitive.

### Text Editing
- Each block is an independently editable region
- Pressing **Enter** at end of a block creates a new `paragraph` block below
- Pressing **Enter** in the middle of a block splits it into two blocks
- Pressing **Backspace** at the start of an empty block deletes it and moves cursor to previous block
- Pressing **Backspace** at the start of a non-empty block merges it with the previous block
- **Arrow Up/Down** at the top/bottom of a block moves cursor to adjacent block

### Slash Commands
- Typing `/` at the start of an empty block (or after a space) opens the slash command menu
- Menu shows block types, filterable by typing (e.g., `/h1` filters to Heading 1)
- Selecting a type converts the current block to that type
- **Escape** closes the menu

### Block Manipulation
- **Tab** indents block (makes it a child of the previous sibling block)
- **Shift+Tab** outdents block (moves it up one nesting level)
- Hover over a block shows a drag handle on the left
- Drag handle allows reordering and nesting via drag and drop
- Click drag handle to open block action menu (Delete, Duplicate, Turn into..., Move to..., Color)

### Inline Formatting
- `Cmd+B` → bold
- `Cmd+I` → italic
- `Cmd+U` → underline
- `Cmd+E` → inline code
- `Cmd+K` → add link
- Selecting text shows a floating toolbar with formatting options

### Markdown Shortcuts (auto-convert on space)
| Input | Converts to |
|-------|------------|
| `# ` | heading_1 |
| `## ` | heading_2 |
| `### ` | heading_3 |
| `- ` or `* ` | bulleted_list |
| `1. ` | numbered_list |
| `[] ` or `[ ] ` | to_do |
| `> ` | quote |
| `---` | divider |
| ` ``` ` | code |

---

## Database Views

### Table View
- Spreadsheet-like grid
- Columns correspond to database properties
- First column is always the row title (links to row-as-page)
- Click cell to edit inline
- Click column header to sort ascending/descending
- Drag column borders to resize
- Click "+" at end of header row to add new property
- Click property name to rename, change type, or delete

### Board View (Kanban)
- Cards grouped by a `select` property (e.g., Status)
- Drag cards between columns to update the grouped property
- Each card shows: title + up to 3 preview properties
- Click card to open as page in a modal/side panel
- "+" button at bottom of each column to add new row with that status pre-filled

### Filtering
- UI to add filter rules: `[Property] [operator] [value]`
- Operators by type:
  - text: is, is not, contains, does not contain, is empty, is not empty
  - select: is, is not
  - multi_select: contains, does not contain
  - date: is, is before, is after, is between
  - checkbox: is checked, is not checked
  - number: =, !=, >, <, >=, <=

### Sorting
- Sort by any property, ascending or descending
- Multiple sort levels (primary, secondary, etc.)

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd+K` | Open Quick Find |
| `Cmd+N` | New page |
| `Cmd+Shift+N` | New page as child of current |
| `Cmd+Z` / `Cmd+Shift+Z` | Undo / Redo |
| `Cmd+B/I/U/E/K` | Bold / Italic / Underline / Code / Link |
| `Esc` | Close any open menu/modal |
| `/` | Open slash command menu |
| `Tab` / `Shift+Tab` | Indent / outdent block |

---

## Quick Find (Cmd+K)

- Modal dialog with search input
- Searches page titles across the workspace
- Results show page icon, title, and breadcrumb path
- Navigate results with arrow keys, Enter to open
- Debounced search (200ms) via API: `GET /api/pages/search?q=<query>&workspace_id=<id>`
- API performs case-insensitive `ILIKE` search on page titles

Add this route:

| Method | Route | Params | Description |
|--------|-------|--------|-------------|
| GET | `/api/pages/search` | `q`, `workspace_id` | Search pages by title, return top 20 matches |

---

## Authentication Flow

1. **Register**: POST email, name, password → hash password with bcrypt → insert user → create default workspace "My Workspace" → create a default "Getting Started" page with sample blocks → return session
2. **Login**: Email + password → verify with bcrypt → issue JWT session
3. **Session**: JWT stored in HTTP-only cookie, includes `{ userId, email, workspaceId }`
4. **Middleware**: Protect all `/api/*` routes (except auth) and `/workspace/*` routes. Redirect unauthenticated users to `/login`.

---

## File Structure

```
app/
├── (auth)/
│   ├── login/page.tsx
│   └── register/page.tsx
├── (app)/
│   └── workspace/
│       └── [workspaceId]/
│           ├── layout.tsx          (AppShell with Sidebar)
│           ├── page.tsx            (redirect to first page or empty state)
│           └── [pageId]/
│               └── page.tsx        (PageView: header + editor or database)
├── api/
│   ├── auth/
│   │   ├── [...nextauth]/route.ts
│   │   └── register/route.ts
│   ├── workspaces/route.ts
│   ├── pages/
│   │   ├── route.ts               (GET list, POST create)
│   │   ├── search/route.ts        (GET search)
│   │   └── [id]/
│   │       ├── route.ts           (GET, PATCH, DELETE)
│   │       └── blocks/
│   │           ├── route.ts       (POST create)
│   │           └── reorder/route.ts (POST batch reorder)
│   ├── blocks/
│   │   └── [id]/route.ts          (PATCH, DELETE)
│   └── databases/
│       └── [pageId]/
│           ├── rows/
│           │   ├── route.ts       (GET list, POST create)
│           │   └── [rowId]/route.ts (PATCH, DELETE)
│           └── config/route.ts    (PATCH update schema)
├── layout.tsx
└── globals.css

components/
├── sidebar/
│   ├── Sidebar.tsx
│   ├── PageTree.tsx
│   ├── PageTreeItem.tsx
│   └── QuickFind.tsx
├── editor/
│   ├── BlockEditor.tsx            (main editor container)
│   ├── Block.tsx                  (single block renderer)
│   ├── blocks/
│   │   ├── ParagraphBlock.tsx
│   │   ├── HeadingBlock.tsx
│   │   ├── ListBlock.tsx
│   │   ├── TodoBlock.tsx
│   │   ├── CodeBlock.tsx
│   │   ├── QuoteBlock.tsx
│   │   ├── CalloutBlock.tsx
│   │   ├── DividerBlock.tsx
│   │   ├── ToggleBlock.tsx
│   │   ├── ImageBlock.tsx
│   │   └── BookmarkBlock.tsx
│   ├── SlashCommandMenu.tsx
│   ├── FloatingToolbar.tsx        (inline formatting toolbar)
│   ├── BlockHandle.tsx            (drag handle + menu)
│   └── useBlockEditor.ts          (core editor hook: key handling, block CRUD)
├── database/
│   ├── DatabaseView.tsx
│   ├── TableView.tsx
│   ├── BoardView.tsx
│   ├── FilterBar.tsx
│   ├── SortBar.tsx
│   ├── PropertyEditor.tsx         (edit property name/type)
│   ├── CellRenderer.tsx           (renders property value by type)
│   └── RowDetailModal.tsx         (open row as page)
├── page/
│   ├── PageHeader.tsx
│   ├── IconPicker.tsx
│   └── CoverPicker.tsx
└── ui/
    ├── Button.tsx
    ├── Input.tsx
    ├── Dialog.tsx
    ├── DropdownMenu.tsx
    ├── Popover.tsx
    └── Tooltip.tsx

lib/
├── db/
│   ├── index.ts                   (Drizzle client)
│   └── schema.ts                  (all table definitions)
├── auth/
│   └── config.ts                  (NextAuth config)
├── hooks/
│   ├── usePages.ts                (SWR hooks for page CRUD)
│   ├── useBlocks.ts               (SWR hooks for block CRUD)
│   └── useDatabaseRows.ts         (SWR hooks for database CRUD)
└── utils.ts                       (shared utilities: cn, generateId, etc.)

drizzle.config.ts
```

---

## Styling Guidelines

- Use Tailwind CSS exclusively; no CSS modules or styled-components
- Light mode only for MVP (dark mode is a follow-up)
- Color palette: neutral grays for chrome, subtle blue for selections/active states
- Typography: system font stack (`font-sans`), page titles in 2.5rem bold
- Blocks should have subtle hover states (light gray background)
- Sidebar: light warm gray background (`bg-stone-50` or similar), 260px width
- Content area: max-width 720px, centered with generous padding
- Transitions: 150ms ease for hover states, 200ms for modals
- Focus rings on all interactive elements for accessibility

---

## Behavior Specifications

### Page Creation
1. Click "+ New Page" in sidebar
2. A new untitled page is created immediately (POST to API)
3. Page appears in sidebar tree and is selected
4. Cursor is placed in the title input
5. A single empty paragraph block is created automatically

### Block Creation
1. User presses Enter in any block → new paragraph block inserted below
2. User types `/` → slash command menu appears
3. User selects block type → current empty paragraph converts to that type
4. Blocks are saved on every change with a 500ms debounce to prevent excessive API calls
5. Use optimistic updates — update UI immediately, sync to server in background

### Page Nesting
- Drag a page onto another page in the sidebar to nest it
- Nested pages appear indented under parent with expand/collapse toggle
- Maximum nesting depth: 5 levels (enforce in UI)
- Moving a page updates its `parent_id` and `sort_order`

### Database Row as Page
- Every database row has a linked page
- Clicking a row title opens the row detail modal
- The modal shows: property fields at top, then a full block editor below
- This allows rich content inside database rows (like Notion)

### Trash / Archive
- Deleting a page sets `is_archived = true` (soft delete)
- Trash section in sidebar lists archived pages
- "Restore" moves page back (sets `is_archived = false`)
- "Delete permanently" hard-deletes the page and all children/blocks
- Pages in trash are excluded from search and sidebar tree

---

## Optimistic Updates & Caching Strategy

- Use SWR (or React Query) for all data fetching
- Mutate local cache immediately on user action (optimistic update)
- Revalidate from server on error (rollback on failure)
- Debounce block content saves at 500ms
- Page list is cached per workspace and revalidated on mutations
- Block list is cached per page

---

## Error Handling

- API routes return consistent error format: `{ error: string, details?: any }`
- 400 for validation errors, 401 for auth, 403 for forbidden, 404 for not found, 500 for server errors
- Frontend shows toast notifications for errors (use a simple toast component)
- Network failures during block saves should queue and retry (up to 3 retries with exponential backoff)

---

## Implementation Order

Build in this exact sequence. Each phase should be fully functional before moving to the next.

### Phase 1: Foundation
1. Initialize Next.js project with TypeScript, Tailwind CSS, ESLint
2. Set up Drizzle ORM with schema and migrations
3. Configure NextAuth with Credentials provider
4. Build login and registration pages
5. Create auth middleware for protected routes

### Phase 2: Page Management
1. Build the AppShell layout (sidebar + content area)
2. Implement page CRUD API routes
3. Build PageTree component in sidebar (recursive, with expand/collapse)
4. Build PageHeader (title editing, icon picker)
5. Implement page creation, renaming, and deletion
6. Implement drag-to-reorder and drag-to-nest in sidebar

### Phase 3: Block Editor
1. Build the Block component system (renderer for each type)
2. Implement BlockEditor with keyboard handling (Enter, Backspace, Arrow keys)
3. Build slash command menu with filtering
4. Implement inline text formatting (bold, italic, etc.) with floating toolbar
5. Implement markdown shortcuts (auto-convert on space)
6. Add block drag-and-drop reordering
7. Add Tab/Shift+Tab indentation
8. Implement debounced auto-save for block changes

### Phase 4: Databases
1. Build database creation flow (convert page to database or create new)
2. Implement database config API (properties, views)
3. Build TableView with inline cell editing
4. Build property type renderers (text, select, date, checkbox, etc.)
5. Build BoardView (Kanban) with drag between columns
6. Implement filter and sort UI
7. Build RowDetailModal (properties + block editor)

### Phase 5: Polish
1. Implement Quick Find (Cmd+K) with search API
2. Implement trash/archive with restore
3. Add loading skeletons and empty states
4. Add toast notifications for errors/success
5. Keyboard shortcut registration and help modal
6. Responsive adjustments (collapse sidebar on small screens)

---

## Out of Scope for MVP

These features are explicitly **not** included in the MVP:

- Real-time collaboration / multiplayer
- Comments and discussions
- Page sharing / public pages
- File uploads (images are URL-only)
- Version history / page history
- Templates
- Dark mode
- Calendar view, timeline view, gallery view
- Formulas and rollups in databases
- Linked databases / relations between databases
- Import/export
- Mobile app
- Workspace members / team features (single-user only for MVP)
- AI features (summarize, generate, etc.)
- Embeds (video, maps, etc.) beyond bookmarks
- Page analytics

---

## Environment Variables

```env
DATABASE_URL=postgresql://user:pass@host:5432/dbname
NEXTAUTH_SECRET=<random 32+ char string>
NEXTAUTH_URL=http://localhost:3000
```

---

## Testing Strategy (Optional but Recommended)

- **API routes**: Test with Vitest + supertest-like fetch calls against route handlers
- **Components**: Test critical interactions with React Testing Library
- **E2E**: Playwright tests for core flows (create page → add blocks → create database → add rows)

Focus E2E tests on:
1. Register → login → see workspace
2. Create page → type title → add heading + paragraph blocks
3. Create database → add rows → switch to board view → drag card
4. Search for page via Cmd+K → navigate to it
5. Archive page → find in trash → restore
