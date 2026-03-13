"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

// Bottom navigation items — the core mobile tabs
const BOTTOM_TABS = [
  { key: "brain", label: "Brain", href: "/brain", icon: BrainTabIcon },
  { key: "inbox", label: "Inbox", href: "/inbox", icon: InboxTabIcon },
  { key: "meetings", label: "Meetings", href: "/krisp", icon: MeetingsTabIcon },
  { key: "calendar", label: "Calendar", href: "/calendar", icon: CalendarTabIcon },
] as const;

// Additional items shown in the "More" drawer
const MORE_ITEMS = [
  { key: "dashboard", label: "Dashboard", href: "/dashboard", icon: DashboardMoreIcon },
  { key: "boards", label: "Kanban", href: "/boards", icon: KanbanMoreIcon },
  { key: "reviews", label: "Reviews", href: "/weekly-reviews", icon: ReviewsMoreIcon },
  { key: "pages", label: "Pages", href: "/workspace", icon: PagesMoreIcon },
  { key: "contacts", label: "Contacts", href: "/contacts", icon: ContactsMoreIcon },
  { key: "activity", label: "Activity", href: "/activity", icon: ActivityMoreIcon },
  { key: "help", label: "Help", href: "/help", icon: HelpMoreIcon },
  { key: "integrations", label: "Integrations", href: "/admin/integrations", icon: IntegrationsMoreIcon },
  { key: "prompts", label: "AI Prompts", href: "/admin/prompts", icon: PromptsMoreIcon },
  { key: "extensions", label: "Extensions", href: "/admin/extensions", icon: ExtensionsMoreIcon },
] as const;

export function MobileBottomNav() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    if (href === "/inbox") return pathname.startsWith("/inbox");
    if (href === "/krisp") return pathname === "/krisp";
    if (href === "/calendar") return pathname.startsWith("/calendar");
    if (href === "/brain") return pathname.startsWith("/brain");
    if (href === "/boards") return pathname.startsWith("/boards");
    if (href === "/weekly-reviews") return pathname.startsWith("/weekly-reviews");
    if (href === "/workspace") return pathname.startsWith("/workspace");
    if (href === "/contacts") return pathname.startsWith("/contacts");
    if (href === "/activity") return pathname === "/activity";
    if (href === "/help") return pathname.startsWith("/help");
    if (href === "/admin/integrations") return pathname.startsWith("/admin/integrations");
    if (href === "/admin/prompts") return pathname.startsWith("/admin/prompts");
    if (href === "/admin/extensions") return pathname.startsWith("/admin/extensions");
    return pathname === href;
  };

  // Check if any "more" item is active (to highlight the More button)
  const moreIsActive = MORE_ITEMS.some((item) => isActive(item.href));

  return (
    <>
      {/* More drawer overlay */}
      {moreOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 md:hidden"
          onClick={() => setMoreOpen(false)}
        />
      )}

      {/* More drawer panel — slides up from bottom */}
      {moreOpen && (
        <div className="fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+64px)] z-50 mx-2 mb-1 rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-xl md:hidden">
          <div className="px-4 py-3 border-b border-[var(--border)]">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-[var(--foreground)]">More</span>
              <button
                onClick={() => setMoreOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--muted-foreground)] hover:bg-[var(--accent)]"
              >
                <CloseTabIcon size={16} />
              </button>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-1 p-3">
            {MORE_ITEMS.map((item) => {
              const active = isActive(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  onClick={() => setMoreOpen(false)}
                  className={`flex flex-col items-center gap-1 rounded-xl px-2 py-3 text-center transition-colors ${
                    active
                      ? "bg-[var(--primary)]/10 text-[var(--primary)]"
                      : "text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--foreground)]"
                  }`}
                >
                  <Icon size={22} />
                  <span className="text-[10px] font-medium leading-tight">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Bottom tab bar */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--border)] bg-[var(--card)]/95 backdrop-blur-lg md:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="flex h-16 items-stretch">
          {BOTTOM_TABS.map((tab) => {
            const active = isActive(tab.href);
            const Icon = tab.icon;
            return (
              <Link
                key={tab.key}
                href={tab.href}
                className={`flex flex-1 flex-col items-center justify-center gap-0.5 transition-colors ${
                  active
                    ? "text-[var(--primary)]"
                    : "text-[var(--muted-foreground)]"
                }`}
              >
                <Icon size={22} active={active} />
                <span className={`text-[10px] font-medium ${active ? "text-[var(--primary)]" : ""}`}>
                  {tab.label}
                </span>
              </Link>
            );
          })}

          {/* More button */}
          <button
            onClick={() => setMoreOpen(!moreOpen)}
            className={`flex flex-1 flex-col items-center justify-center gap-0.5 transition-colors ${
              moreIsActive || moreOpen
                ? "text-[var(--primary)]"
                : "text-[var(--muted-foreground)]"
            }`}
          >
            <MoreTabIcon size={22} active={moreIsActive || moreOpen} />
            <span className={`text-[10px] font-medium ${moreIsActive || moreOpen ? "text-[var(--primary)]" : ""}`}>
              More
            </span>
          </button>
        </div>
      </nav>
    </>
  );
}

// ── Tab Icons ──────────────────────────────────────────

function BrainTabIcon({ size = 22, active = false }: { size?: number; active?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z" />
      <path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z" />
      <path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4" />
    </svg>
  );
}

function InboxTabIcon({ size = 22, active = false }: { size?: number; active?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 12h-6l-2 3H10l-2-3H2" />
      <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
    </svg>
  );
}

function MeetingsTabIcon({ size = 22, active = false }: { size?: number; active?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 18a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2" />
      <rect width="18" height="18" x="3" y="4" rx="2" />
      <circle cx="12" cy="10" r="2" />
      <line x1="8" x2="8" y1="2" y2="4" />
      <line x1="16" x2="16" y1="2" y2="4" />
    </svg>
  );
}

function CalendarTabIcon({ size = 22, active = false }: { size?: number; active?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
      <line x1="16" x2="16" y1="2" y2="6" />
      <line x1="8" x2="8" y1="2" y2="6" />
      <line x1="3" x2="21" y1="10" y2="10" />
    </svg>
  );
}

function MoreTabIcon({ size = 22, active = false }: { size?: number; active?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="1" />
      <circle cx="19" cy="12" r="1" />
      <circle cx="5" cy="12" r="1" />
    </svg>
  );
}

function CloseTabIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

// ── More drawer icons ──────────────────────────────────

function HelpMoreIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <path d="M12 17h.01" />
    </svg>
  );
}

function DashboardMoreIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="9" rx="1" />
      <rect x="14" y="3" width="7" height="5" rx="1" />
      <rect x="14" y="12" width="7" height="9" rx="1" />
      <rect x="3" y="16" width="7" height="5" rx="1" />
    </svg>
  );
}

function KanbanMoreIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M9 3v18" />
      <path d="M15 3v18" />
    </svg>
  );
}

function ReviewsMoreIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 2v4" />
      <path d="M16 2v4" />
      <rect width="18" height="18" x="3" y="4" rx="2" />
      <path d="M3 10h18" />
      <path d="M10 14h4" />
    </svg>
  );
}

function PagesMoreIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
      <path d="M14 2v4a2 2 0 0 0 2 2h4" />
    </svg>
  );
}

function ContactsMoreIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function ActivityMoreIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 8v4l3 3" />
      <circle cx="12" cy="12" r="10" />
    </svg>
  );
}

function IntegrationsMoreIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2v4" />
      <path d="m6.8 15-3.5 2" />
      <path d="m20.7 7-3.5 2" />
      <path d="M6.8 9 3.3 7" />
      <path d="m20.7 17-3.5-2" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}

function PromptsMoreIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 8V4H8" />
      <rect width="16" height="12" x="4" y="8" rx="2" />
      <path d="M2 14h2" />
      <path d="M20 14h2" />
      <path d="M15 13v2" />
      <path d="M9 13v2" />
    </svg>
  );
}

function ExtensionsMoreIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 2H9a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1Z" />
      <path d="M8 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2" />
      <path d="m9 14 2 2 4-4" />
    </svg>
  );
}
