"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import type { EmailListItem } from "@/types/email";
import { SwipeableRow } from "@/components/email/SwipeableRow";

interface NewsletterCard {
  emailId: string | number;
  heroImage: string | null;
  links: { text: string; url: string }[];
  senderName: string;
  senderDomain: string;
}

interface NewsletterCardViewProps {
  emails: EmailListItem[];
  onEmailClick: (emailId: string | number) => void;
  onMarkDone: (emailId: string | number, currentlyDone: boolean) => void;
}

function formatRelativeTime(dateStr: string): string {
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

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

/** Generate a stable pastel background color from a sender name. */
function senderColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash) % 360;
  return `hsl(${h}, 60%, 88%)`;
}

function senderInitial(name: string): string {
  return name.charAt(0).toUpperCase();
}

export function NewsletterCardView({
  emails,
  onEmailClick,
  onMarkDone,
}: NewsletterCardViewProps) {
  const [cards, setCards] = useState<Map<string | number, NewsletterCard>>(
    new Map()
  );
  const [loading, setLoading] = useState(false);
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());

  const fetchCardData = useCallback(
    async (emailIds: (string | number)[]) => {
      if (emailIds.length === 0) return;
      setLoading(true);
      try {
        const res = await fetch("/api/emails/newsletter-cards", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ emailIds }),
        });
        if (!res.ok) return;
        const { data } = await res.json();
        setCards((prev) => {
          const next = new Map(prev);
          for (const card of data as NewsletterCard[]) {
            next.set(card.emailId, card);
          }
          return next;
        });
      } catch {
        // Fail silently
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Fetch card data when emails change
  useEffect(() => {
    const idsToFetch = emails
      .filter((e) => !cards.has(e.id))
      .map((e) => e.id);
    if (idsToFetch.length > 0) {
      fetchCardData(idsToFetch);
    }
    // Only re-run when email IDs change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [emails.map((e) => e.id).join(",")]);

  if (emails.length === 0) {
    return (
      <div className="text-center py-20">
        <svg
          className="w-16 h-16 mx-auto text-[var(--muted-foreground)]/30 mb-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2"
          />
        </svg>
        <h3 className="text-xl font-medium text-[var(--foreground)] mb-2">
          No newsletters yet
        </h3>
        <p className="text-[var(--muted-foreground)] max-w-md mx-auto">
          Newsletter emails will appear here as visual cards.
        </p>
      </div>
    );
  }

  return (
    <div className="p-3 md:p-6">
      {/* Loading skeleton */}
      {loading && cards.size === 0 && (
        <div className="columns-1 sm:columns-2 lg:columns-4 gap-4 space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="break-inside-avoid rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden animate-pulse"
            >
              <div className="h-40 bg-[var(--secondary)]" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-[var(--secondary)] rounded w-3/4" />
                <div className="h-3 bg-[var(--secondary)] rounded w-1/2" />
                <div className="h-3 bg-[var(--secondary)] rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Card grid — CSS columns for masonry-like layout */}
      <div className="columns-1 sm:columns-2 lg:columns-4 gap-4 space-y-4">
        {emails.map((email) => {
          const card = cards.get(email.id);
          const hasHero =
            card?.heroImage && !failedImages.has(card.heroImage);
          const bgColor = senderColor(
            card?.senderName || email.sender
          );
          const initial = senderInitial(
            card?.senderName || email.sender
          );
          const displayName = card?.senderName || email.sender.split("@")[0];

          return (
            <SwipeableRow
              key={email.id}
              onSwipeRight={() => onMarkDone(email.id, !!email.is_done)}
              isDone={!!email.is_done}
              className="break-inside-avoid rounded-xl"
            >
            <div
              className="rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden hover:shadow-lg hover:border-[var(--primary)]/30 transition-all duration-200 group cursor-pointer"
              onClick={() => onEmailClick(email.id)}
            >
              {/* Hero image or gradient fallback */}
              {hasHero ? (
                <div className="relative w-full overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={card!.heroImage!}
                    alt=""
                    className="w-full h-auto object-cover max-h-64"
                    loading="lazy"
                    onError={() => {
                      setFailedImages((prev) =>
                        new Set(prev).add(card!.heroImage!)
                      );
                    }}
                  />
                  {/* Gradient overlay at bottom for text readability */}
                  <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-black/30 to-transparent" />
                </div>
              ) : (
                <div
                  className="w-full h-24 flex items-center justify-center"
                  style={{ backgroundColor: bgColor }}
                >
                  <span className="text-3xl font-bold text-black/30">
                    {initial}
                  </span>
                </div>
              )}

              {/* Card body */}
              <div className="p-4">
                {/* Sender row */}
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                    style={{
                      backgroundColor: bgColor,
                      color: "rgba(0,0,0,0.6)",
                    }}
                  >
                    {initial}
                  </div>
                  <span className="text-xs font-medium text-[var(--muted-foreground)] truncate">
                    {displayName}
                  </span>
                  <span className="text-[10px] text-[var(--muted-foreground)] ml-auto flex-shrink-0">
                    {formatRelativeTime(email.received_at)}
                  </span>
                </div>

                {/* Subject */}
                <h3
                  className={`text-sm leading-snug mb-1 line-clamp-2 ${
                    !email.is_read
                      ? "font-semibold text-[var(--foreground)]"
                      : "font-medium text-[var(--foreground)]"
                  }`}
                >
                  {email.subject || "(No subject)"}
                </h3>

                {/* Preview */}
                {email.preview && (
                  <p className="text-xs text-[var(--muted-foreground)] line-clamp-2 mb-3">
                    {email.preview}
                  </p>
                )}

                {/* Quick links */}
                {card && card.links.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {card.links.slice(0, 3).map((link, i) => (
                      <a
                        key={i}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-full bg-[var(--primary)]/5 text-[var(--primary)] hover:bg-[var(--primary)]/15 transition-colors truncate max-w-[180px]"
                        title={link.text}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="10"
                          height="10"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="flex-shrink-0"
                        >
                          <path d="M15 3h6v6" />
                          <path d="M10 14 21 3" />
                          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                        </svg>
                        <span className="truncate">{link.text}</span>
                      </a>
                    ))}
                    {card.links.length > 3 && (
                      <span className="text-[10px] text-[var(--muted-foreground)] px-1.5 py-1">
                        +{card.links.length - 3} more
                      </span>
                    )}
                  </div>
                )}

                {/* Unread dot + actions */}
                <div className="flex items-center justify-between mt-3 pt-2 border-t border-[var(--border)]/50">
                  <div className="flex items-center gap-2">
                    {!email.is_read && (
                      <span className="w-2 h-2 rounded-full bg-[var(--primary)]" title="Unread" />
                    )}
                    {email.unsubscribe_link && (
                      <a
                        href={email.unsubscribe_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-[10px] text-red-500 hover:text-red-600 transition-colors"
                      >
                        Unsubscribe
                      </a>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onMarkDone(email.id, !!email.is_done);
                      }}
                      className="p-1 rounded text-[var(--muted-foreground)] hover:text-emerald-600 hover:bg-emerald-500/10 transition-colors opacity-0 group-hover:opacity-100"
                      title={email.is_done ? "Move to inbox" : "Done"}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                        <polyline points="22 4 12 14.01 9 11.01" />
                      </svg>
                    </button>
                    <Link
                      href={`/inbox/${email.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="p-1 rounded text-[var(--muted-foreground)] hover:text-[var(--primary)] hover:bg-[var(--primary)]/10 transition-colors opacity-0 group-hover:opacity-100"
                      title="Open full"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M15 3h6v6" />
                        <path d="M10 14 21 3" />
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                      </svg>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
            </SwipeableRow>
          );
        })}
      </div>
    </div>
  );
}
