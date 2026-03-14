"use client";

import { useState, useEffect, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import {
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  MessageSquare,
  User,
  Bot,
  RefreshCw,
  Globe,
  Monitor,
  Clock,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────

interface SessionSummary {
  id: string;
  messageCount: number;
  firstMessage: string;
  pageUrl: string | null;
  createdAt: string;
}

interface SessionDetail {
  id: string;
  pageUrl: string | null;
  userAgent: string | null;
  createdAt: string;
  messages: ConversationMessage[];
}

interface ConversationMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

// ── Component ────────────────────────────────────────────

export function ConversationsClient() {
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const [selectedSession, setSelectedSession] = useState<SessionDetail | null>(
    null
  );
  const [loadingSession, setLoadingSession] = useState(false);

  // ── Fetch sessions list ────────────────────────────────

  const fetchSessions = useCallback(
    async (page: number) => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/admin/support/conversations?page=${page}`
        );
        if (res.ok) {
          const data = await res.json();
          setSessions(data.sessions ?? []);
          setTotalPages(data.totalPages ?? 1);
          setCurrentPage(page);
        }
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchSessions(1);
  }, [fetchSessions]);

  // ── Fetch session detail ───────────────────────────────

  async function openSession(sessionId: string) {
    setLoadingSession(true);
    try {
      const res = await fetch(
        `/api/admin/support/conversations/${sessionId}`
      );
      if (res.ok) {
        const data = await res.json();
        setSelectedSession(data.session ?? null);
      }
    } finally {
      setLoadingSession(false);
    }
  }

  function backToList() {
    setSelectedSession(null);
  }

  // ── Format date helper ─────────────────────────────────

  function formatDate(dateStr: string) {
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function formatTime(dateStr: string) {
    const d = new Date(dateStr);
    return d.toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  // ── Truncate helper ────────────────────────────────────

  function truncate(text: string, maxLen: number) {
    if (text.length <= maxLen) return text;
    return text.slice(0, maxLen) + "...";
  }

  // ── Render: Session Detail View ────────────────────────

  if (selectedSession) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10">
        {/* Header with back button */}
        <div className="mb-6 flex items-center gap-3">
          <button
            onClick={backToList}
            className="flex h-8 w-8 items-center justify-center rounded-md border border-[var(--border)] text-[var(--muted-foreground)] hover:bg-[var(--muted)] transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-[var(--foreground)]">
              Conversation
            </h1>
            <p className="text-sm text-[var(--muted-foreground)]">
              {formatDate(selectedSession.createdAt)}
            </p>
          </div>
        </div>

        {/* Session metadata */}
        <div className="mb-6 rounded-lg border border-[var(--border)] bg-[var(--background)] p-4 space-y-2">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
            Session Info
          </h2>
          <div className="grid gap-3 sm:grid-cols-3 text-sm">
            <div className="flex items-center gap-2 text-[var(--muted-foreground)]">
              <Clock className="h-3.5 w-3.5" />
              <span>{formatDate(selectedSession.createdAt)}</span>
            </div>
            {selectedSession.pageUrl && (
              <div className="flex items-center gap-2 text-[var(--muted-foreground)]">
                <Globe className="h-3.5 w-3.5" />
                <span className="truncate">{selectedSession.pageUrl}</span>
              </div>
            )}
            {selectedSession.userAgent && (
              <div className="flex items-center gap-2 text-[var(--muted-foreground)]">
                <Monitor className="h-3.5 w-3.5" />
                <span className="truncate text-xs">
                  {selectedSession.userAgent}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Messages thread */}
        <div className="space-y-4">
          {selectedSession.messages.map((msg) => {
            const isUser = msg.role === "user";
            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isUser ? "" : ""}`}
              >
                {/* Avatar */}
                <div
                  className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${
                    isUser
                      ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                      : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  }`}
                >
                  {isUser ? (
                    <User className="h-4 w-4" />
                  ) : (
                    <Bot className="h-4 w-4" />
                  )}
                </div>

                {/* Message content */}
                <div className="flex-1 min-w-0">
                  <div className="mb-1 flex items-center gap-2">
                    <span
                      className={`text-xs font-semibold ${
                        isUser
                          ? "text-blue-600 dark:text-blue-400"
                          : "text-emerald-600 dark:text-emerald-400"
                      }`}
                    >
                      {isUser ? "User" : "Brain"}
                    </span>
                    <span className="text-[10px] text-[var(--muted-foreground)]">
                      {formatTime(msg.createdAt)}
                    </span>
                  </div>

                  <div
                    className={`rounded-lg px-4 py-3 text-sm ${
                      isUser
                        ? "bg-blue-500/5 border border-blue-500/10 text-[var(--foreground)]"
                        : "bg-emerald-500/5 border border-emerald-500/10 text-[var(--foreground)]"
                    }`}
                  >
                    {isUser ? (
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    ) : (
                      <div className="prose prose-sm dark:prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {selectedSession.messages.length === 0 && (
            <div className="rounded-lg border border-[var(--border)] bg-[var(--background)] p-8 text-center text-sm text-[var(--muted-foreground)]">
              No messages in this conversation.
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Render: Sessions List View ─────────────────────────

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <a
          href="/admin/support"
          className="flex h-8 w-8 items-center justify-center rounded-md border border-[var(--border)] text-[var(--muted-foreground)] hover:bg-[var(--muted)] transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
        </a>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-[var(--foreground)]">
            Conversations
          </h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            Browse chat sessions between users and the support agent.
          </p>
        </div>
        <button
          onClick={() => fetchSessions(currentPage)}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-md border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--muted-foreground)] hover:bg-[var(--muted)] transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Loading state */}
      {loading && sessions.length === 0 ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-16 animate-pulse rounded-lg bg-[var(--muted)]"
            />
          ))}
        </div>
      ) : sessions.length === 0 ? (
        <div className="rounded-lg border border-[var(--border)] bg-[var(--background)] p-12 text-center">
          <MessageSquare className="mx-auto mb-3 h-8 w-8 text-[var(--muted-foreground)]" />
          <p className="text-sm text-[var(--muted-foreground)]">
            No conversations yet. Chat sessions will appear here once users
            start interacting with the support widget.
          </p>
        </div>
      ) : (
        <>
          {/* Sessions table */}
          <div className="rounded-lg border border-[var(--border)] overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--muted)]/50">
                  <th className="px-4 py-3 text-left font-medium text-[var(--muted-foreground)]">
                    Time
                  </th>
                  <th className="px-4 py-3 text-center font-medium text-[var(--muted-foreground)]">
                    Messages
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-[var(--muted-foreground)]">
                    First Message
                  </th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((session) => (
                  <tr
                    key={session.id}
                    onClick={() => openSession(session.id)}
                    className="cursor-pointer border-b border-[var(--border)] last:border-0 hover:bg-[var(--muted)]/30 transition-colors"
                  >
                    <td className="px-4 py-3 whitespace-nowrap font-mono text-xs text-[var(--muted-foreground)]">
                      {formatDate(session.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center gap-1 rounded-full bg-[var(--muted)] px-2 py-0.5 text-xs font-medium text-[var(--foreground)]">
                        <MessageSquare className="h-3 w-3" />
                        {session.messageCount}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[var(--foreground)]">
                      <p className="truncate max-w-[400px]">
                        {truncate(session.firstMessage || "No messages", 80)}
                      </p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-xs text-[var(--muted-foreground)]">
                Page {currentPage} of {totalPages}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => fetchSessions(currentPage - 1)}
                  disabled={currentPage <= 1 || loading}
                  className="flex items-center gap-1 rounded-md border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--muted-foreground)] hover:bg-[var(--muted)] transition-colors disabled:opacity-50"
                >
                  <ChevronLeft className="h-3 w-3" />
                  Previous
                </button>
                <button
                  onClick={() => fetchSessions(currentPage + 1)}
                  disabled={currentPage >= totalPages || loading}
                  className="flex items-center gap-1 rounded-md border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--muted-foreground)] hover:bg-[var(--muted)] transition-colors disabled:opacity-50"
                >
                  Next
                  <ChevronRight className="h-3 w-3" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Loading overlay for session detail fetch */}
      {loadingSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-6 py-4 shadow-lg">
            <div className="flex items-center gap-3">
              <RefreshCw className="h-4 w-4 animate-spin text-[var(--muted-foreground)]" />
              <span className="text-sm text-[var(--foreground)]">
                Loading conversation...
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
