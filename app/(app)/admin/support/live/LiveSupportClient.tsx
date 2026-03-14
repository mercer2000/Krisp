"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Power,
  PowerOff,
  Send,
  X,
  Loader2,
  Clock,
  MessageSquare,
  ChevronRight,
  ArrowLeft,
} from "lucide-react";
import ReactMarkdown from "react-markdown";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PendingSession {
  id: string;
  firstMessage: string;
  messageCount: number;
  pageUrl: string | null;
  escalatedAt: string;
}

interface ActiveSession {
  id: string;
  lastMessage: string;
  messageCount: number;
  updatedAt: string;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "agent" | "system";
  content: string;
  agentId: string | null;
  createdAt: string;
}

interface SessionDetail {
  id: string;
  status: string;
  metadata: { pageUrl?: string; userAgent?: string; referrer?: string } | null;
  escalatedAt: string | null;
  agentNotes: string | null;
  createdAt: string;
}

interface CannedResponse {
  id: string;
  title: string;
  content: string;
  category: string | null;
  shortcut: string | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function LiveSupportClient() {
  // ---- State ----
  const [isOnline, setIsOnline] = useState(false);
  const [pendingSessions, setPendingSessions] = useState<PendingSession[]>([]);
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(
    null
  );
  const [sessionDetail, setSessionDetail] = useState<SessionDetail | null>(
    null
  );
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [agentNotes, setAgentNotes] = useState("");
  const [cannedResponses, setCannedResponses] = useState<CannedResponse[]>([]);
  const [cannedSearch, setCannedSearch] = useState("");
  const [pendingCount, setPendingCount] = useState(0);

  // ---- Refs ----
  const pingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const queuePollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const messagePollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const notificationAudioRef = useRef<HTMLAudioElement | null>(null);
  const prevPendingCountRef = useRef(0);

  // ---- Go online/offline ----
  const goOnline = useCallback(async () => {
    try {
      await fetch("/api/admin/support/live/go-online", { method: "POST" });
      setIsOnline(true);
    } catch {
      // ignore
    }
  }, []);

  const goOffline = useCallback(async () => {
    try {
      await fetch("/api/admin/support/live/go-offline", { method: "POST" });
      setIsOnline(false);
    } catch {
      // ignore
    }
  }, []);

  // ---- Ping heartbeat (30s) ----
  useEffect(() => {
    if (!isOnline) {
      if (pingRef.current) clearInterval(pingRef.current);
      return;
    }

    async function doPing() {
      try {
        const res = await fetch("/api/admin/support/live/ping", {
          method: "POST",
        });
        if (res.ok) {
          const data = await res.json();
          setPendingCount(data.pendingCount);
        }
      } catch {
        // ignore
      }
    }

    doPing();
    pingRef.current = setInterval(doPing, 30_000);

    return () => {
      if (pingRef.current) clearInterval(pingRef.current);
    };
  }, [isOnline]);

  // ---- Poll queue & active sessions (5s) ----
  useEffect(() => {
    if (!isOnline) {
      if (queuePollRef.current) clearInterval(queuePollRef.current);
      return;
    }

    async function pollQueue() {
      try {
        const [queueRes, activeRes] = await Promise.all([
          fetch("/api/admin/support/live/queue"),
          fetch("/api/admin/support/live/active"),
        ]);

        if (queueRes.ok) {
          const data = await queueRes.json();
          setPendingSessions(data.sessions);

          // Play notification if new sessions arrived
          if (
            data.sessions.length > prevPendingCountRef.current &&
            prevPendingCountRef.current >= 0
          ) {
            // Simple beep notification
            try {
              const ctx = new AudioContext();
              const osc = ctx.createOscillator();
              const gain = ctx.createGain();
              osc.connect(gain);
              gain.connect(ctx.destination);
              osc.frequency.value = 800;
              gain.gain.value = 0.3;
              osc.start();
              osc.stop(ctx.currentTime + 0.15);
            } catch {
              // ignore audio errors
            }
          }
          prevPendingCountRef.current = data.sessions.length;
        }

        if (activeRes.ok) {
          const data = await activeRes.json();
          setActiveSessions(data.sessions);
        }
      } catch {
        // ignore
      }
    }

    pollQueue();
    queuePollRef.current = setInterval(pollQueue, 5_000);

    return () => {
      if (queuePollRef.current) clearInterval(queuePollRef.current);
    };
  }, [isOnline]);

  // ---- Poll selected session messages (3s) ----
  useEffect(() => {
    if (!selectedSessionId) {
      if (messagePollRef.current) clearInterval(messagePollRef.current);
      return;
    }

    async function pollMessages() {
      try {
        const res = await fetch(
          `/api/admin/support/live/session/${selectedSessionId}`
        );
        if (res.ok) {
          const data = await res.json();
          setSessionDetail(data.session);
          setMessages(data.messages);
        }
      } catch {
        // ignore
      }
    }

    pollMessages();
    messagePollRef.current = setInterval(pollMessages, 3_000);

    return () => {
      if (messagePollRef.current) clearInterval(messagePollRef.current);
    };
  }, [selectedSessionId]);

  // ---- Auto-scroll messages ----
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ---- Fetch canned responses ----
  useEffect(() => {
    async function fetchCanned() {
      try {
        const res = await fetch("/api/admin/support/canned-responses");
        if (res.ok) {
          const data = await res.json();
          setCannedResponses(data.responses);
        }
      } catch {
        // ignore
      }
    }
    fetchCanned();
  }, []);

  // ---- Cleanup on unmount — go offline ----
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (isOnline) {
        navigator.sendBeacon("/api/admin/support/live/go-offline");
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      if (isOnline) {
        navigator.sendBeacon("/api/admin/support/live/go-offline");
      }
    };
  }, [isOnline]);

  // ---- Actions ----
  const claimSession = useCallback(async (sessionId: string) => {
    try {
      const res = await fetch("/api/admin/support/live/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
      if (res.ok) {
        setSelectedSessionId(sessionId);
      }
    } catch {
      // ignore
    }
  }, []);

  const sendMessage = useCallback(async () => {
    if (!messageInput.trim() || !selectedSessionId || isSending) return;

    setIsSending(true);
    try {
      const res = await fetch("/api/admin/support/live/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: selectedSessionId,
          content: messageInput.trim(),
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => [...prev, data.message]);
        setMessageInput("");
        inputRef.current?.focus();
      }
    } catch {
      // ignore
    } finally {
      setIsSending(false);
    }
  }, [messageInput, selectedSessionId, isSending]);

  const closeSession = useCallback(async () => {
    if (!selectedSessionId) return;
    try {
      await fetch("/api/admin/support/live/close", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: selectedSessionId,
          notes: agentNotes || undefined,
        }),
      });
      setSelectedSessionId(null);
      setSessionDetail(null);
      setMessages([]);
      setAgentNotes("");
    } catch {
      // ignore
    }
  }, [selectedSessionId, agentNotes]);

  const saveNotes = useCallback(async () => {
    // Notes are saved when closing the session, not separately
  }, []);

  const insertCannedResponse = useCallback(
    (content: string) => {
      setMessageInput((prev) => (prev ? prev + "\n" + content : content));
      inputRef.current?.focus();
    },
    []
  );

  const filteredCanned = cannedSearch
    ? cannedResponses.filter(
        (r) =>
          r.title.toLowerCase().includes(cannedSearch.toLowerCase()) ||
          r.shortcut?.toLowerCase().includes(cannedSearch.toLowerCase()) ||
          r.category?.toLowerCase().includes(cannedSearch.toLowerCase())
      )
    : cannedResponses;

  // ---- Render ----
  return (
    <div className="flex h-[calc(100vh-64px)] bg-[var(--background)]">
      {/* ---- Left Panel: Queue & Active ---- */}
      <div className="w-[300px] shrink-0 border-r border-[var(--border)] flex flex-col">
        {/* Online toggle */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
          <span className="text-sm font-medium text-[var(--foreground)]">
            Live Support
          </span>
          <button
            type="button"
            onClick={isOnline ? goOffline : goOnline}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              isOnline
                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
            }`}
          >
            {isOnline ? (
              <>
                <Power size={12} /> Online
              </>
            ) : (
              <>
                <PowerOff size={12} /> Offline
              </>
            )}
          </button>
        </div>

        {!isOnline ? (
          <div className="flex-1 flex items-center justify-center p-6 text-center">
            <p className="text-sm text-[var(--muted-foreground)]">
              Go online to start receiving support chats.
            </p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            {/* Pending queue */}
            <div className="px-3 pt-3 pb-1">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
                Pending ({pendingSessions.length})
              </h3>
            </div>
            {pendingSessions.length === 0 ? (
              <p className="px-3 py-2 text-xs text-[var(--muted-foreground)]">
                No pending chats
              </p>
            ) : (
              pendingSessions.map((s) => (
                <div
                  key={s.id}
                  className="mx-2 mb-1 rounded-lg border border-[var(--border)] p-3"
                >
                  <p className="text-sm text-[var(--foreground)] line-clamp-2 mb-1">
                    {s.firstMessage}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[var(--muted-foreground)] flex items-center gap-1">
                      <Clock size={10} /> {timeAgo(s.escalatedAt)}
                    </span>
                    <button
                      type="button"
                      onClick={() => claimSession(s.id)}
                      className="rounded-md bg-indigo-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-indigo-700 transition-colors"
                    >
                      Claim
                    </button>
                  </div>
                </div>
              ))
            )}

            {/* Active sessions */}
            <div className="px-3 pt-4 pb-1">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
                My Conversations ({activeSessions.length})
              </h3>
            </div>
            {activeSessions.length === 0 ? (
              <p className="px-3 py-2 text-xs text-[var(--muted-foreground)]">
                No active conversations
              </p>
            ) : (
              activeSessions.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSelectedSessionId(s.id)}
                  className={`mx-2 mb-1 w-[calc(100%-16px)] rounded-lg border p-3 text-left transition-colors ${
                    selectedSessionId === s.id
                      ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20"
                      : "border-[var(--border)] hover:bg-[var(--accent)]"
                  }`}
                >
                  <p className="text-sm text-[var(--foreground)] line-clamp-1 mb-1">
                    {s.lastMessage || "No messages yet"}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[var(--muted-foreground)] flex items-center gap-1">
                      <MessageSquare size={10} /> {s.messageCount}
                    </span>
                    <span className="text-xs text-[var(--muted-foreground)]">
                      {timeAgo(s.updatedAt)}
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* ---- Center Panel: Chat ---- */}
      <div className="flex-1 flex flex-col min-w-0">
        {!selectedSessionId ? (
          <div className="flex-1 flex items-center justify-center text-center p-8">
            <div>
              <MessageSquare
                size={40}
                className="mx-auto mb-3 text-[var(--muted-foreground)] opacity-40"
              />
              <p className="text-sm text-[var(--muted-foreground)]">
                {isOnline
                  ? "Select a conversation from the left panel or claim a pending chat."
                  : "Go online to start handling support chats."}
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div className="shrink-0 flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
              <div className="flex items-center gap-3 min-w-0">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedSessionId(null);
                    setSessionDetail(null);
                    setMessages([]);
                  }}
                  className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
                >
                  <ArrowLeft size={18} />
                </button>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[var(--foreground)] truncate">
                    {sessionDetail?.metadata?.pageUrl
                      ? new URL(sessionDetail.metadata.pageUrl).pathname
                      : "Support Chat"}
                  </p>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    {sessionDetail?.createdAt
                      ? timeAgo(sessionDetail.createdAt)
                      : ""}
                    {" \u00b7 "}
                    {messages.length} messages
                  </p>
                </div>
              </div>
              {sessionDetail?.status === "agent_active" && (
                <button
                  type="button"
                  onClick={closeSession}
                  className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20 transition-colors"
                >
                  Close Conversation
                </button>
              )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              {messages.map((msg) => {
                if (msg.role === "system") {
                  return (
                    <div key={msg.id} className="flex justify-center">
                      <p className="text-xs italic text-[var(--muted-foreground)] text-center px-4 py-1">
                        {msg.content}
                      </p>
                    </div>
                  );
                }

                const isUser = msg.role === "user";
                const roleLabel =
                  msg.role === "agent"
                    ? "You"
                    : msg.role === "assistant"
                      ? "Brain (AI)"
                      : "User";

                return (
                  <div
                    key={msg.id}
                    className={`flex ${isUser ? "justify-start" : "justify-end"}`}
                  >
                    <div
                      className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                        msg.role === "agent"
                          ? "ml-auto bg-indigo-600 text-white"
                          : msg.role === "assistant"
                            ? "mr-auto bg-amber-50 dark:bg-amber-900/20 text-[var(--foreground)] border border-amber-200 dark:border-amber-800"
                            : "mr-auto bg-gray-100 dark:bg-gray-800 text-[var(--foreground)]"
                      }`}
                    >
                      <p
                        className={`text-[10px] font-medium mb-0.5 ${
                          msg.role === "agent"
                            ? "text-white/70"
                            : "text-[var(--muted-foreground)]"
                        }`}
                      >
                        {roleLabel}{" "}
                        <span className="font-normal">
                          {timeAgo(msg.createdAt)}
                        </span>
                      </p>
                      <div className="prose prose-sm dark:prose-invert max-w-none [&_p]:my-1">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input area */}
            {sessionDetail?.status === "agent_active" && (
              <div className="shrink-0 border-t border-[var(--border)] px-4 py-3">
                <div className="flex items-end gap-2">
                  <textarea
                    ref={inputRef}
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                    placeholder="Type your reply..."
                    rows={2}
                    className="flex-1 resize-none rounded-xl border border-[var(--border)] bg-[var(--background)] px-3.5 py-2.5 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-2 focus:outline-indigo-500"
                    style={{ maxHeight: "120px" }}
                    disabled={isSending}
                  />
                  <button
                    type="button"
                    onClick={sendMessage}
                    disabled={!messageInput.trim() || isSending}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:bg-indigo-700"
                  >
                    {isSending ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <Send size={18} />
                    )}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ---- Right Panel: Tools ---- */}
      {selectedSessionId && (
        <div className="w-[280px] shrink-0 border-l border-[var(--border)] flex flex-col overflow-y-auto">
          {/* Session Info */}
          <div className="px-4 py-3 border-b border-[var(--border)]">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)] mb-2">
              Session Info
            </h3>
            <div className="space-y-1 text-xs text-[var(--muted-foreground)]">
              {sessionDetail?.metadata?.pageUrl && (
                <p className="truncate" title={sessionDetail.metadata.pageUrl}>
                  Page: {sessionDetail.metadata.pageUrl}
                </p>
              )}
              {sessionDetail?.escalatedAt && (
                <p>Escalated: {timeAgo(sessionDetail.escalatedAt)}</p>
              )}
              <p>Messages: {messages.length}</p>
              <p>Status: {sessionDetail?.status}</p>
            </div>
          </div>

          {/* Agent Notes */}
          <div className="px-4 py-3 border-b border-[var(--border)]">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)] mb-2">
              Agent Notes
            </h3>
            <textarea
              value={agentNotes}
              onChange={(e) => setAgentNotes(e.target.value)}
              placeholder="Internal notes (saved when closing)..."
              rows={3}
              className="w-full resize-none rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-xs text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-2 focus:outline-indigo-500"
            />
          </div>

          {/* Canned Responses */}
          <div className="px-4 py-3 flex-1">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)] mb-2">
              Canned Responses
            </h3>
            <input
              type="text"
              value={cannedSearch}
              onChange={(e) => setCannedSearch(e.target.value)}
              placeholder="Search..."
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-1.5 text-xs text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] mb-2 focus:outline-2 focus:outline-indigo-500"
            />
            <div className="space-y-1">
              {filteredCanned.length === 0 ? (
                <p className="text-xs text-[var(--muted-foreground)]">
                  No canned responses
                </p>
              ) : (
                filteredCanned.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => insertCannedResponse(r.content)}
                    className="w-full text-left rounded-lg border border-[var(--border)] p-2 text-xs hover:bg-[var(--accent)] transition-colors"
                  >
                    <p className="font-medium text-[var(--foreground)]">
                      {r.title}
                      {r.shortcut && (
                        <span className="ml-1 text-[var(--muted-foreground)]">
                          {r.shortcut}
                        </span>
                      )}
                    </p>
                    <p className="text-[var(--muted-foreground)] line-clamp-1 mt-0.5">
                      {r.content}
                    </p>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
