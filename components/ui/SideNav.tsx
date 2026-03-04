"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { ThemeToggle } from "./ThemeToggle";
import { UpcomingEvents } from "@/components/calendar/UpcomingEvents";

// ---------------------------------------------------------------------------
// Nav items configuration
// ---------------------------------------------------------------------------

const NAV_ITEMS = [
  {
    key: "brain",
    label: "Brain",
    href: "/brain",
    icon: BrainIcon,
    shortcut: "Ctrl+B",
  },
  {
    key: "dashboard",
    label: "Dashboard",
    href: "/dashboard",
    icon: DashboardIcon,
  },
  {
    key: "weekly-reviews",
    label: "Reviews",
    href: "/weekly-reviews",
    icon: WeeklyReviewIcon,
  },
  {
    key: "boards",
    label: "Kanban",
    href: "/boards",
    icon: KanbanIcon,
  },
  {
    key: "decisions",
    label: "Decisions",
    href: "/decisions",
    icon: DecisionsIcon,
  },
  {
    key: "pages",
    label: "Pages",
    href: "/workspace",
    icon: PagesIcon,
  },
  {
    key: "inbox",
    label: "Inbox",
    href: "/inbox",
    icon: InboxIcon,
  },
  {
    key: "krisp",
    label: "Meetings",
    href: "/krisp",
    icon: MeetingsIcon,
  },
  {
    key: "calendar",
    label: "Calendar",
    href: "/calendar",
    icon: CalendarIcon,
  },
  {
    key: "analytics",
    label: "Analytics",
    href: "/analytics",
    icon: AnalyticsIcon,
  },
  {
    key: "integrations",
    label: "Integrations",
    href: "/admin/integrations",
    icon: IntegrationsIcon,
  },
  {
    key: "trash",
    label: "Trash",
    href: "/trash",
    icon: TrashNavIcon,
  },
] as const;

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------

function DashboardIcon({ size = 20 }: { size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="3" width="7" height="9" rx="1" />
      <rect x="14" y="3" width="7" height="5" rx="1" />
      <rect x="14" y="12" width="7" height="9" rx="1" />
      <rect x="3" y="16" width="7" height="5" rx="1" />
    </svg>
  );
}

function InboxIcon({ size = 20 }: { size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 12h-6l-2 3H10l-2-3H2" />
      <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
    </svg>
  );
}

function MeetingsIcon({ size = 20 }: { size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17 18a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2" />
      <rect width="18" height="18" x="3" y="4" rx="2" />
      <circle cx="12" cy="10" r="2" />
      <line x1="8" x2="8" y1="2" y2="4" />
      <line x1="16" x2="16" y1="2" y2="4" />
    </svg>
  );
}

function CalendarIcon({ size = 20 }: { size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
      <line x1="16" x2="16" y1="2" y2="6" />
      <line x1="8" x2="8" y1="2" y2="6" />
      <line x1="3" x2="21" y1="10" y2="10" />
    </svg>
  );
}

function KanbanIcon({ size = 20 }: { size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M9 3v18" />
      <path d="M15 3v18" />
    </svg>
  );
}

function PagesIcon({ size = 20 }: { size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
      <path d="M14 2v4a2 2 0 0 0 2 2h4" />
      <path d="M10 9H8" />
      <path d="M16 13H8" />
      <path d="M16 17H8" />
    </svg>
  );
}

function BrainIcon({ size = 20 }: { size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z" />
      <path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z" />
      <path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4" />
      <path d="M17.599 6.5a3 3 0 0 0 .399-1.375" />
      <path d="M6.003 5.125A3 3 0 0 0 6.401 6.5" />
      <path d="M3.477 10.896a4 4 0 0 1 .585-.396" />
      <path d="M19.938 10.5a4 4 0 0 1 .585.396" />
      <path d="M6 18a4 4 0 0 1-1.967-.516" />
      <path d="M19.967 17.484A4 4 0 0 1 18 18" />
    </svg>
  );
}

function DecisionsIcon({ size = 20 }: { size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
      <path d="M20 3v4" />
      <path d="M22 5h-4" />
    </svg>
  );
}

function WeeklyReviewIcon({ size = 20 }: { size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M8 2v4" />
      <path d="M16 2v4" />
      <rect width="18" height="18" x="3" y="4" rx="2" />
      <path d="M3 10h18" />
      <path d="M10 14h4" />
    </svg>
  );
}

function AnalyticsIcon({ size = 20 }: { size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 3v18h18" />
      <path d="m19 9-5 5-4-4-3 3" />
    </svg>
  );
}

function IntegrationsIcon({ size = 20 }: { size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 2v4" />
      <path d="m6.8 15-3.5 2" />
      <path d="m20.7 7-3.5 2" />
      <path d="M6.8 9 3.3 7" />
      <path d="m20.7 17-3.5-2" />
      <path d="m9 22 3-8 3 8" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}

function TrashNavIcon({ size = 20 }: { size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  );
}

function MenuIcon({ size = 20 }: { size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="4" y1="12" x2="20" y2="12" />
      <line x1="4" y1="6" x2="20" y2="6" />
      <line x1="4" y1="18" x2="20" y2="18" />
    </svg>
  );
}

function ChevronLeftIcon({ size = 20 }: { size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

function SignOutIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// SideNav Component
// ---------------------------------------------------------------------------

export function SideNav() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [lastBoardId, setLastBoardId] = useState<string | null>(null);

  // Persist collapsed state and read last board from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("sidenav-collapsed");
    if (saved !== null) {
      setCollapsed(saved === "true");
    }
    setLastBoardId(localStorage.getItem("last-board-id"));
  }, []);

  // Keep lastBoardId in sync when navigating to a board
  useEffect(() => {
    const match = pathname.match(/^\/boards\/(.+)/);
    if (match) {
      setLastBoardId(match[1]);
    }
  }, [pathname]);

  const toggleCollapsed = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem("sidenav-collapsed", String(next));
  };

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    if (href === "/inbox") return pathname.startsWith("/inbox");
    if (href === "/krisp") return pathname === "/krisp";
    if (href === "/calendar") return pathname.startsWith("/calendar");
    if (href === "/boards") return pathname.startsWith("/boards");
    if (href === "/workspace") return pathname.startsWith("/workspace");
    if (href === "/brain") return pathname.startsWith("/brain");
    if (href === "/decisions") return pathname.startsWith("/decisions");
    if (href === "/weekly-reviews") return pathname.startsWith("/weekly-reviews");
    if (href === "/analytics") return pathname.startsWith("/analytics");
    if (href === "/admin/integrations") return pathname.startsWith("/admin/integrations");
    if (href === "/trash") return pathname === "/trash";
    return pathname === href;
  };

  return (
    <nav
      className={`flex h-full flex-col border-r border-[var(--border)] bg-[var(--card)] transition-[width] duration-200 ${
        collapsed ? "w-[60px]" : "w-[200px]"
      }`}
    >
      {/* Logo / Collapse toggle */}
      <div className="flex h-14 items-center border-b border-[var(--border)] px-3">
        {!collapsed && (
          <span className="flex-1 text-base font-bold text-[var(--foreground)] tracking-tight">
            Life
          </span>
        )}
        <button
          onClick={toggleCollapsed}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--muted-foreground)] transition-colors hover:bg-[var(--accent)] hover:text-[var(--foreground)]"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <MenuIcon size={18} /> : <ChevronLeftIcon size={18} />}
        </button>
      </div>

      {/* Nav links */}
      <div className="flex flex-1 flex-col gap-1 p-2">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;
          const shortcut = "shortcut" in item ? item.shortcut : undefined;
          const resolvedHref =
            item.key === "boards" && lastBoardId
              ? `/boards/${lastBoardId}`
              : item.href;
          return (
            <Link
              key={item.key}
              href={resolvedHref}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-[var(--primary)]/10 text-[var(--primary)]"
                  : "text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--foreground)]"
              } ${collapsed ? "justify-center px-0" : ""}`}
              title={collapsed ? `${item.label}${shortcut ? ` (${shortcut})` : ""}` : undefined}
            >
              <Icon size={20} />
              {!collapsed && (
                <>
                  <span className="flex-1">{item.label}</span>
                  {shortcut && (
                    <kbd className="ml-auto rounded border border-[var(--border)] bg-[var(--background)] px-1.5 py-0.5 text-[10px] font-normal text-[var(--muted-foreground)]">
                      {shortcut}
                    </kbd>
                  )}
                </>
              )}
            </Link>
          );
        })}
      </div>

      {/* Upcoming events widget */}
      {!collapsed && (
        <div className="border-t border-[var(--border)]">
          <UpcomingEvents />
        </div>
      )}

      {/* Bottom controls */}
      <div className="border-t border-[var(--border)] p-2">
        <div className={`flex items-center ${collapsed ? "flex-col gap-2" : "gap-2"}`}>
          <ThemeToggle />
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className={`flex items-center gap-2 rounded-lg text-sm font-medium text-[var(--muted-foreground)] transition-colors hover:bg-[var(--accent)] hover:text-[var(--foreground)] ${
              collapsed ? "h-8 w-8 justify-center" : "flex-1 px-3 py-2"
            }`}
            title="Sign Out"
            aria-label="Sign Out"
          >
            <SignOutIcon size={16} />
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>
      </div>
    </nav>
  );
}
