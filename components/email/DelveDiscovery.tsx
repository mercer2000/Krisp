"use client";

import { useState, useMemo, useCallback } from "react";
import type { EmailListItem } from "@/types/email";
import { categorize, ALL_CATEGORIES, type Category } from "@/lib/email/categorize";
import { hashColor, initials, displayName } from "@/lib/email/hashColor";

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

type CardSize = "hero" | "large" | "wide" | "standard";

interface SizedEmail extends EmailListItem {
  size: CardSize;
  category: Category;
  senderName: string;
  senderInitials: string;
  senderColor: string;
  timeAgo: string;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

const SIZE_PATTERN: CardSize[] = [
  "hero", "large", "large", "standard", "standard",
  "wide", "standard", "standard", "standard", "standard",
];

function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function enrichEmail(email: EmailListItem, index: number): SizedEmail {
  const name = displayName(email.sender);
  return {
    ...email,
    size: SIZE_PATTERN[index % SIZE_PATTERN.length],
    category: categorize(email.subject || "", email.preview || ""),
    senderName: name,
    senderInitials: initials(email.sender),
    senderColor: hashColor(name),
    timeAgo: formatTimeAgo(email.received_at),
  };
}

/* ------------------------------------------------------------------ */
/*  Category Icon                                                     */
/* ------------------------------------------------------------------ */

function CategoryIcon({ icon, size = 10 }: { icon: string; size?: number }) {
  const props = {
    xmlns: "http://www.w3.org/2000/svg",
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  switch (icon) {
    case "calendar":
      return (
        <svg {...props}>
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      );
    case "dollar":
      return (
        <svg {...props}>
          <line x1="12" y1="1" x2="12" y2="23" />
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      );
    case "code":
      return (
        <svg {...props}>
          <polyline points="16 18 22 12 16 6" />
          <polyline points="8 6 2 12 8 18" />
        </svg>
      );
    case "chart":
      return (
        <svg {...props}>
          <line x1="18" y1="20" x2="18" y2="10" />
          <line x1="12" y1="20" x2="12" y2="4" />
          <line x1="6" y1="20" x2="6" y2="14" />
        </svg>
      );
    case "file":
      return (
        <svg {...props}>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
      );
    case "people":
      return (
        <svg {...props}>
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      );
    case "newspaper":
      return (
        <svg {...props}>
          <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" />
          <path d="M18 14h-8" />
          <path d="M15 18h-5" />
          <path d="M10 6h8v4h-8V6Z" />
        </svg>
      );
    default: // mail
      return (
        <svg {...props}>
          <rect x="2" y="4" width="20" height="16" rx="2" />
          <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
        </svg>
      );
  }
}

/* ------------------------------------------------------------------ */
/*  Filter Bar                                                        */
/* ------------------------------------------------------------------ */

function FilterBar({
  active,
  onSelect,
  counts,
}: {
  active: string | null;
  onSelect: (label: string | null) => void;
  counts: Record<string, number>;
}) {
  const categories = useMemo(() => {
    // Only show categories that have at least 1 email
    return ALL_CATEGORIES.filter((c) => (counts[c.label] || 0) > 0);
  }, [counts]);

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
      <button
        onClick={() => onSelect(null)}
        className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${
          active === null
            ? "bg-[var(--primary)] text-white shadow-sm"
            : "bg-[var(--secondary)] text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--foreground)]"
        }`}
      >
        All
      </button>
      {categories.map((cat) => (
        <button
          key={cat.label}
          onClick={() => onSelect(active === cat.label ? null : cat.label)}
          className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 flex items-center gap-1.5 ${
            active === cat.label
              ? "shadow-sm text-white"
              : "bg-[var(--secondary)] text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--foreground)]"
          }`}
          style={
            active === cat.label
              ? { backgroundColor: cat.color }
              : undefined
          }
        >
          <CategoryIcon icon={cat.icon} size={11} />
          {cat.label}
          <span className="opacity-60">({counts[cat.label] || 0})</span>
        </button>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Detail Overlay                                                    */
/* ------------------------------------------------------------------ */

function DetailOverlay({
  email,
  onClose,
  onOpen,
}: {
  email: SizedEmail;
  onClose: () => void;
  onOpen: (id: string | number) => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200" />

      {/* Card */}
      <div
        className="relative w-full max-w-lg bg-[var(--card)] rounded-2xl shadow-2xl border border-[var(--border)] overflow-hidden animate-in zoom-in-95 fade-in duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Gradient header */}
        <div
          className="h-20 relative"
          style={{
            background: `linear-gradient(135deg, ${email.category.color}, ${email.senderColor})`,
          }}
        >
          <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-[var(--card)] to-transparent" />
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/20 hover:bg-black/40 text-white flex items-center justify-center transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="px-6 pb-6 -mt-6 relative">
          {/* Avatar */}
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold mb-4 border-4 border-[var(--card)] shadow-md"
            style={{ backgroundColor: email.senderColor, color: "#fff" }}
          >
            {email.senderInitials}
          </div>

          {/* Sender + time */}
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="text-sm font-semibold text-[var(--foreground)]">
                {email.senderName}
              </div>
              <div className="text-xs text-[var(--muted-foreground)]">
                {email.sender}
              </div>
            </div>
            <div className="text-xs text-[var(--muted-foreground)] flex-shrink-0">
              {email.timeAgo}
            </div>
          </div>

          {/* Subject */}
          <h3 className="text-base font-semibold text-[var(--foreground)] mb-2 leading-snug">
            {email.subject || "(No subject)"}
          </h3>

          {/* Category badge */}
          <span
            className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full mb-3"
            style={{
              backgroundColor: email.category.color + "18",
              color: email.category.color,
            }}
          >
            <CategoryIcon icon={email.category.icon} size={10} />
            {email.category.label}
          </span>

          {/* Snippet */}
          {email.preview && (
            <p className="text-sm text-[var(--muted-foreground)] leading-relaxed mb-5 line-clamp-[8]">
              {email.preview}
            </p>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpen(email.id)}
              className="flex-1 px-4 py-2 rounded-lg bg-[var(--primary)] text-white text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Open Email
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-[var(--secondary)] text-[var(--foreground)] text-sm font-medium hover:bg-[var(--accent)] transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Email Card                                                        */
/* ------------------------------------------------------------------ */

function EmailCard({
  email,
  index,
  onClick,
}: {
  email: SizedEmail;
  index: number;
  onClick: () => void;
}) {
  const isHero = email.size === "hero";
  const isLarge = email.size === "large";
  const isWide = email.size === "wide";
  const showSnippet = isHero || isLarge || isWide;

  // Grid span classes
  let gridClass = "";
  if (isHero) gridClass = "md:col-span-2 md:row-span-2";
  else if (isWide) gridClass = "md:col-span-2";

  const headerHeight = isHero ? "h-[130px]" : isLarge ? "h-[85px]" : "h-[58px]";

  return (
    <div
      className={`group rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden cursor-pointer transition-all duration-[280ms] ease-[cubic-bezier(.4,0,.2,1)] hover:shadow-xl hover:-translate-y-1 hover:border-[var(--primary)]/30 ${gridClass}`}
      style={{
        animationDelay: `${index * 40}ms`,
        animationFillMode: "both",
      }}
      onClick={onClick}
    >
      {/* Gradient header */}
      <div
        className={`${headerHeight} relative overflow-hidden`}
        style={{
          background: `linear-gradient(135deg, ${email.category.color}, ${email.senderColor})`,
        }}
      >
        {/* Decorative circles */}
        <div
          className="absolute -top-6 -right-6 w-20 h-20 rounded-full opacity-10"
          style={{ backgroundColor: "#fff" }}
        />
        <div
          className="absolute -bottom-4 -left-4 w-16 h-16 rounded-full opacity-10"
          style={{ backgroundColor: "#fff" }}
        />

        {/* Category badge in header */}
        <div className="absolute top-3 right-3">
          <span
            className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/20 text-white backdrop-blur-sm"
          >
            <CategoryIcon icon={email.category.icon} size={10} />
            {email.category.label}
          </span>
        </div>

        {/* Sender avatar in header for hero cards */}
        {isHero && (
          <div className="absolute bottom-3 left-4 flex items-center gap-2">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border-2 border-white/30"
              style={{ backgroundColor: email.senderColor, color: "#fff" }}
            >
              {email.senderInitials}
            </div>
            <div>
              <div className="text-sm font-semibold text-white drop-shadow-sm">
                {email.senderName}
              </div>
              <div className="text-[11px] text-white/70">
                {email.timeAgo}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Card body */}
      <div className={isHero ? "p-5" : "p-3.5"}>
        {/* Sender row (non-hero cards) */}
        {!isHero && (
          <div className="flex items-center gap-2 mb-2">
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
              style={{ backgroundColor: email.senderColor, color: "#fff" }}
            >
              {email.senderInitials}
            </div>
            <span className="text-xs font-semibold text-[var(--muted-foreground)] truncate">
              {email.senderName}
            </span>
            <span className="text-[10px] text-[var(--muted-foreground)] ml-auto flex-shrink-0">
              {email.timeAgo}
            </span>
          </div>
        )}

        {/* Subject */}
        <h3
          className={`leading-snug mb-1 ${
            isHero
              ? "text-lg font-semibold"
              : "text-sm font-semibold"
          } ${
            !email.is_read
              ? "text-[var(--foreground)]"
              : "text-[var(--foreground)]/80"
          }`}
        >
          <span className={isHero ? "line-clamp-3" : "line-clamp-2"}>
            {email.subject || "(No subject)"}
          </span>
        </h3>

        {/* Snippet */}
        {email.preview && (
          <p
            className={`text-xs text-[var(--muted-foreground)] leading-relaxed ${
              isHero ? "line-clamp-[8]" : "line-clamp-[5]"
            }`}
          >
            {email.preview}
          </p>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-[var(--border)]/40">
          <div className="flex items-center gap-1.5">
            {!email.is_read && (
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)]" title="Unread" />
            )}
            {email.has_attachments && (
              <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--muted-foreground)]">
                <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
              </svg>
            )}
          </div>
          {isHero && (
            <span className="text-[10px] text-[var(--muted-foreground)]">
              {email.timeAgo}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                    */
/* ------------------------------------------------------------------ */

interface DelveDiscoveryProps {
  emails: EmailListItem[];
  onEmailClick: (emailId: string | number) => void;
  onMarkDone: (emailId: string | number, currentlyDone: boolean) => void;
}

export function DelveDiscovery({
  emails,
  onEmailClick,
  onMarkDone,
}: DelveDiscoveryProps) {
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [selectedEmail, setSelectedEmail] = useState<SizedEmail | null>(null);

  // Enrich emails with sizes, categories, sender info
  const enrichedEmails = useMemo(() => {
    return emails.map((e, i) => enrichEmail(e, i));
  }, [emails]);

  // Category counts for filter pills
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const e of enrichedEmails) {
      counts[e.category.label] = (counts[e.category.label] || 0) + 1;
    }
    return counts;
  }, [enrichedEmails]);

  // Filtered list
  const filteredEmails = useMemo(() => {
    if (!activeFilter) return enrichedEmails;
    return enrichedEmails.filter((e) => e.category.label === activeFilter);
  }, [enrichedEmails, activeFilter]);

  const handleCardClick = useCallback((email: SizedEmail) => {
    setSelectedEmail(email);
  }, []);

  const handleOpenEmail = useCallback(
    (id: string | number) => {
      setSelectedEmail(null);
      onEmailClick(id);
    },
    [onEmailClick]
  );

  if (emails.length === 0) {
    return (
      <div className="text-center py-20 px-4">
        <svg
          className="w-16 h-16 mx-auto text-[var(--muted-foreground)]/30 mb-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <rect x="2" y="4" width="20" height="16" rx="2" />
          <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
        </svg>
        <h3 className="text-xl font-medium text-[var(--foreground)] mb-2">
          No emails to discover
        </h3>
        <p className="text-[var(--muted-foreground)] max-w-md mx-auto">
          Emails will appear here as categorized cards once they are received.
        </p>
      </div>
    );
  }

  return (
    <div className="p-3 md:p-6">
      {/* Filter pills */}
      <div className="mb-5">
        <FilterBar
          active={activeFilter}
          onSelect={setActiveFilter}
          counts={categoryCounts}
        />
      </div>

      {/* Card grid — CSS Grid with variable card sizes */}
      <div
        className="grid gap-4 animate-in fade-in duration-300"
        style={{
          gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
        }}
      >
        {filteredEmails.map((email, i) => (
          <EmailCard
            key={email.id}
            email={email}
            index={i}
            onClick={() => handleCardClick(email)}
          />
        ))}
      </div>

      {/* Detail overlay */}
      {selectedEmail && (
        <DetailOverlay
          email={selectedEmail}
          onClose={() => setSelectedEmail(null)}
          onOpen={handleOpenEmail}
        />
      )}
    </div>
  );
}
