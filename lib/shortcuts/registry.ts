// ---------------------------------------------------------------------------
// Centralized Keyboard Shortcut Registry
// Single source of truth for all bindings — feeds command palette + reference sheet
// ---------------------------------------------------------------------------

export type ShortcutCategory =
  | "Navigation"
  | "Kanban"
  | "Email"
  | "Meetings"
  | "Open Brain"
  | "Global";

export interface ShortcutEntry {
  /** Unique key used to identify this shortcut */
  id: string;
  /** Human-readable label shown in palette & reference sheet */
  label: string;
  /** Category grouping */
  category: ShortcutCategory;
  /** Key combo string(s) — first is primary, rest are aliases.
   *  Format: modifier keys joined with "+", e.g. "Ctrl+K", "Shift+/".
   *  Use "Mod" for Ctrl on Windows/Linux and Cmd on Mac.  */
  keys: string[];
  /** Optional description for the reference sheet */
  description?: string;
  /** If true this shortcut opens the command palette — handled specially */
  isPaletteToggle?: boolean;
  /** Action type discriminator for the hook to dispatch */
  action:
    | { type: "navigate"; href: string }
    | { type: "callback"; id: string }
    | { type: "palette" };
}

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

export const SHORTCUT_REGISTRY: ShortcutEntry[] = [
  // ---- Global ----
  {
    id: "palette",
    label: "Open Command Palette",
    category: "Global",
    keys: ["Mod+K"],
    description: "Search commands, navigate, and take actions",
    isPaletteToggle: true,
    action: { type: "palette" },
  },
  {
    id: "shortcut-reference",
    label: "Show Keyboard Shortcuts",
    category: "Global",
    keys: ["Shift+/"],
    description: "Open the full shortcut reference sheet",
    action: { type: "callback", id: "shortcut-reference" },
  },
  {
    id: "toggle-theme",
    label: "Toggle Dark / Light Mode",
    category: "Global",
    keys: ["Mod+Shift+L"],
    description: "Cycle between system, light, and dark themes",
    action: { type: "callback", id: "toggle-theme" },
  },

  // ---- Navigation ----
  {
    id: "nav-brain",
    label: "Go to Brain",
    category: "Navigation",
    keys: ["Mod+B"],
    action: { type: "navigate", href: "/brain" },
  },
  {
    id: "nav-dashboard",
    label: "Go to Dashboard",
    category: "Navigation",
    keys: ["G D"],
    description: "Press G then D in sequence",
    action: { type: "navigate", href: "/dashboard" },
  },
  {
    id: "nav-boards",
    label: "Go to Kanban Boards",
    category: "Navigation",
    keys: ["G B"],
    description: "Press G then B in sequence",
    action: { type: "navigate", href: "/boards" },
  },
  {
    id: "nav-inbox",
    label: "Go to Inbox",
    category: "Navigation",
    keys: ["G I"],
    description: "Press G then I in sequence",
    action: { type: "navigate", href: "/inbox" },
  },
  {
    id: "nav-meetings",
    label: "Go to Meetings",
    category: "Navigation",
    keys: ["G M"],
    description: "Press G then M in sequence",
    action: { type: "navigate", href: "/krisp" },
  },
  {
    id: "nav-calendar",
    label: "Go to Calendar",
    category: "Navigation",
    keys: ["G C"],
    description: "Press G then C in sequence",
    action: { type: "navigate", href: "/calendar" },
  },
  {
    id: "nav-pages",
    label: "Go to Pages",
    category: "Navigation",
    keys: ["G P"],
    description: "Press G then P in sequence",
    action: { type: "navigate", href: "/workspace" },
  },
  {
    id: "nav-settings",
    label: "Go to Settings",
    category: "Navigation",
    keys: ["G S"],
    description: "Press G then S in sequence",
    action: { type: "navigate", href: "/settings" },
  },
  {
    id: "nav-contacts",
    label: "Go to Contacts",
    category: "Navigation",
    keys: [],
    action: { type: "navigate", href: "/contacts" },
  },
  {
    id: "nav-reviews",
    label: "Go to Weekly Reviews",
    category: "Navigation",
    keys: [],
    action: { type: "navigate", href: "/weekly-reviews" },
  },
  {
    id: "nav-analytics",
    label: "Go to Analytics",
    category: "Navigation",
    keys: [],
    action: { type: "navigate", href: "/krisp?tab=analytics" },
  },
  {
    id: "nav-activity",
    label: "Go to Activity Feed",
    category: "Navigation",
    keys: [],
    action: { type: "navigate", href: "/activity" },
  },
  {
    id: "nav-integrations",
    label: "Go to Integrations",
    category: "Navigation",
    keys: [],
    action: { type: "navigate", href: "/admin/integrations" },
  },
  {
    id: "nav-prompts",
    label: "Go to AI Prompts",
    category: "Navigation",
    keys: [],
    action: { type: "navigate", href: "/admin/prompts" },
  },
  {
    id: "nav-extensions",
    label: "Go to Extensions",
    category: "Navigation",
    keys: [],
    action: { type: "navigate", href: "/admin/extensions" },
  },
  {
    id: "nav-trash",
    label: "Go to Trash",
    category: "Navigation",
    keys: [],
    action: { type: "navigate", href: "/trash" },
  },

  // ---- Kanban ----
  {
    id: "kanban-new-card",
    label: "Create New Card",
    category: "Kanban",
    keys: ["C"],
    description: "Navigates to boards to create a new card",
    action: { type: "callback", id: "kanban-new-card" },
  },
  {
    id: "kanban-search",
    label: "Search Cards",
    category: "Kanban",
    keys: ["/"],
    description: "Open card search within the current board",
    action: { type: "callback", id: "kanban-search" },
  },

  // ---- Email ----
  {
    id: "email-compose",
    label: "Compose Email",
    category: "Email",
    keys: [],
    description: "Open email compose in inbox",
    action: { type: "navigate", href: "/inbox" },
  },
  {
    id: "email-search",
    label: "Search Emails",
    category: "Email",
    keys: [],
    description: "Semantic search across your inbox",
    action: { type: "navigate", href: "/inbox" },
  },

  // ---- Meetings ----
  {
    id: "meetings-search",
    label: "Search Meetings",
    category: "Meetings",
    keys: [],
    description: "AI-powered semantic search across meeting transcripts",
    action: { type: "navigate", href: "/krisp" },
  },

  // ---- Open Brain ----
  {
    id: "brain-capture",
    label: "Quick Capture to Brain",
    category: "Open Brain",
    keys: ["Mod+Shift+B"],
    description: "Capture a thought to your brain",
    action: { type: "callback", id: "brain-capture" },
  },
  {
    id: "brain-search",
    label: "Search Brain",
    category: "Open Brain",
    keys: [],
    description: "Semantic search across your knowledge base",
    action: { type: "navigate", href: "/brain" },
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Return the platform-aware display string for a key combo */
export function formatShortcut(combo: string, isMac: boolean): string {
  return combo
    .replace(/Mod/g, isMac ? "\u2318" : "Ctrl")
    .replace(/Shift/g, isMac ? "\u21E7" : "Shift")
    .replace(/Alt/g, isMac ? "\u2325" : "Alt")
    .replace(/Ctrl/g, isMac ? "\u2303" : "Ctrl");
}

/** Get the first shortcut display string for an entry, or undefined */
export function primaryShortcutDisplay(
  entry: ShortcutEntry,
  isMac: boolean,
): string | undefined {
  if (entry.keys.length === 0) return undefined;
  return formatShortcut(entry.keys[0], isMac);
}

/** Group the registry by category */
export function groupByCategory(): Map<ShortcutCategory, ShortcutEntry[]> {
  const map = new Map<ShortcutCategory, ShortcutEntry[]>();
  for (const entry of SHORTCUT_REGISTRY) {
    let arr = map.get(entry.category);
    if (!arr) {
      arr = [];
      map.set(entry.category, arr);
    }
    arr.push(entry);
  }
  return map;
}
