"use client";

import { useState, useEffect, useRef, useCallback } from "react";

// ── Types ───────────────────────────────────────────
interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  sourcesUsed?: string[];
  createdAt: string;
}

interface ChatSession {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

// ── Markdown-lite renderer ──────────────────────────
function renderMarkdown(text: string) {
  // Split into paragraphs, handle basic markdown
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let inList = false;
  let listItems: string[] = [];

  const flushList = () => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={`list-${elements.length}`} className="my-2 ml-4 list-disc space-y-1">
          {listItems.map((item, i) => (
            <li key={i} className="text-sm text-[var(--foreground)]">
              {formatInline(item)}
            </li>
          ))}
        </ul>
      );
      listItems = [];
    }
    inList = false;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Headers
    if (line.startsWith("### ")) {
      flushList();
      elements.push(
        <h3 key={i} className="mt-3 mb-1 text-sm font-bold text-[var(--foreground)]">
          {formatInline(line.slice(4))}
        </h3>
      );
    } else if (line.startsWith("## ")) {
      flushList();
      elements.push(
        <h2 key={i} className="mt-3 mb-1 text-base font-bold text-[var(--foreground)]">
          {formatInline(line.slice(3))}
        </h2>
      );
    } else if (line.startsWith("# ")) {
      flushList();
      elements.push(
        <h1 key={i} className="mt-3 mb-1 text-lg font-bold text-[var(--foreground)]">
          {formatInline(line.slice(2))}
        </h1>
      );
    } else if (line.match(/^[-*] /)) {
      inList = true;
      listItems.push(line.replace(/^[-*] /, ""));
    } else if (line.match(/^\d+\. /)) {
      // Numbered list - treat similarly
      inList = true;
      listItems.push(line.replace(/^\d+\. /, ""));
    } else {
      flushList();
      if (line.trim() === "") {
        elements.push(<div key={i} className="h-2" />);
      } else {
        elements.push(
          <p key={i} className="text-sm leading-relaxed text-[var(--foreground)]">
            {formatInline(line)}
          </p>
        );
      }
    }
  }
  flushList();

  return <>{elements}</>;
}

function formatInline(text: string): React.ReactNode {
  // Bold: **text**
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold">
          {part.slice(2, -2)}
        </strong>
      );
    }
    // Inline code: `text`
    const codeParts = part.split(/(`[^`]+`)/g);
    return codeParts.map((cp, j) => {
      if (cp.startsWith("`") && cp.endsWith("`")) {
        return (
          <code
            key={`${i}-${j}`}
            className="rounded bg-[var(--accent)] px-1 py-0.5 text-xs font-mono"
          >
            {cp.slice(1, -1)}
          </code>
        );
      }
      return cp;
    });
  });
}

// ── Source badge colors ─────────────────────────────
const SOURCE_COLORS: Record<string, string> = {
  meetings:
    "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  emails:
    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  decisions:
    "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  action_items:
    "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  kanban:
    "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
  brain_thoughts:
    "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400",
};

const SOURCE_LABELS: Record<string, string> = {
  meetings: "Meetings",
  emails: "Emails",
  decisions: "Decisions",
  action_items: "Action Items",
  kanban: "Kanban",
  brain_thoughts: "Brain Thoughts",
};

// ── Types for Knowledge Feed ────────────────────────
interface BrainThought {
  id: string;
  content: string;
  source: string;
  author: string | null;
  topic: string | null;
  sentiment: string | null;
  tags: string[] | null;
  sourceUrl: string | null;
  sourceDomain: string | null;
  sourceTimestamp: string | null;
  truncated: boolean;
  createdAt: string;
}

// ── Main Component ──────────────────────────────────
export default function BrainChatPage() {
  const [activeTab, setActiveTab] = useState<"chat" | "knowledge">("chat");
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Knowledge feed state
  const [thoughts, setThoughts] = useState<BrainThought[]>([]);
  const [thoughtsTotal, setThoughtsTotal] = useState(0);
  const [loadingThoughts, setLoadingThoughts] = useState(false);
  const [sourceFilter, setSourceFilter] = useState<string>("");

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load sessions on mount
  useEffect(() => {
    fetchSessions();
  }, []);

  // Auto-focus input when page loads
  useEffect(() => {
    if (activeTab === "chat") inputRef.current?.focus();
  }, [activeTab]);

  // Fetch thoughts when knowledge tab is active or filter changes
  useEffect(() => {
    if (activeTab === "knowledge") {
      fetchThoughts();
    }
  }, [activeTab, sourceFilter]);

  const fetchThoughts = async () => {
    setLoadingThoughts(true);
    try {
      const params = new URLSearchParams({ limit: "50", offset: "0" });
      if (sourceFilter) params.set("source", sourceFilter);
      const res = await fetch(`/api/brain/thoughts?${params}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setThoughts(data.thoughts);
      setThoughtsTotal(data.total);
    } catch {
      console.error("Failed to load thoughts");
    } finally {
      setLoadingThoughts(false);
    }
  };

  const fetchSessions = async () => {
    try {
      const res = await fetch("/api/brain/sessions");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setSessions(data.sessions);
    } catch {
      console.error("Failed to load sessions");
    } finally {
      setLoadingSessions(false);
    }
  };

  const loadSession = useCallback(async (sessionId: string) => {
    setActiveSessionId(sessionId);
    setLoadingMessages(true);
    try {
      const res = await fetch(`/api/brain/sessions/${sessionId}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setMessages(data.messages);
    } catch {
      console.error("Failed to load session messages");
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  const startNewChat = () => {
    setActiveSessionId(null);
    setMessages([]);
    inputRef.current?.focus();
  };

  const deleteSession = async (sessionId: string) => {
    try {
      await fetch(`/api/brain/sessions/${sessionId}`, { method: "DELETE" });
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      if (activeSessionId === sessionId) {
        startNewChat();
      }
    } catch {
      console.error("Failed to delete session");
    }
  };

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || sending) return;

    // Optimistic UI: show user message immediately
    const tempUserMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      role: "user",
      content: text,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);
    setInput("");
    setSending(true);

    try {
      const res = await fetch("/api/brain/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          sessionId: activeSessionId,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        if (res.status === 402 || errorData?.error === "token_limit") {
          throw new Error("token_limit");
        }
        throw new Error("Failed to send");
      }
      const data = await res.json();

      // If this was a new session, update state
      if (!activeSessionId) {
        setActiveSessionId(data.sessionId);
        // Refresh sessions list
        fetchSessions();
      }

      // Add assistant message
      setMessages((prev) => [...prev, data.message]);
    } catch (err) {
      const isTokenLimit = err instanceof Error && err.message === "token_limit";
      // Remove optimistic message and show error
      setMessages((prev) =>
        prev.filter((m) => m.id !== tempUserMsg.id).concat({
          id: `error-${Date.now()}`,
          role: "assistant",
          content: isTokenLimit
            ? "The AI service credit limit has been reached. Please check your OpenRouter API key limits at openrouter.ai/settings/keys and increase the monthly budget."
            : "Sorry, I encountered an error processing your message. Please try again.",
          createdAt: new Date().toISOString(),
        })
      );
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex h-full bg-[var(--background)]">
      {/* Sidebar: session list (only shown on chat tab) */}
      {activeTab === "chat" && showSidebar && (
        <aside className="flex w-[260px] flex-shrink-0 flex-col border-r border-[var(--border)] bg-[var(--card)]">
          <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
            <h2 className="text-sm font-bold text-[var(--foreground)]">
              Chats
            </h2>
            <button
              onClick={startNewChat}
              className="rounded-lg bg-[var(--primary)] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:opacity-90"
              title="New chat"
            >
              + New
            </button>
          </div>

          <div className="flex-1 overflow-auto p-2">
            {loadingSessions ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-10 animate-pulse rounded-lg bg-[var(--accent)]"
                  />
                ))}
              </div>
            ) : sessions.length === 0 ? (
              <p className="px-2 py-4 text-center text-xs text-[var(--muted-foreground)]">
                No conversations yet. Start a new chat!
              </p>
            ) : (
              <div className="space-y-1">
                {sessions.map((s) => (
                  <div
                    key={s.id}
                    className={`group flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors cursor-pointer ${
                      activeSessionId === s.id
                        ? "bg-[var(--primary)]/10 text-[var(--primary)]"
                        : "text-[var(--foreground)] hover:bg-[var(--accent)]"
                    }`}
                    onClick={() => loadSession(s.id)}
                  >
                    <ChatBubbleIcon size={14} />
                    <span className="flex-1 truncate">{s.title}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteSession(s.id);
                      }}
                      className="hidden rounded p-0.5 text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-red-500 group-hover:block"
                      title="Delete chat"
                    >
                      <TrashIcon size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>
      )}

      {/* Main chat area */}
      <div className="flex flex-1 flex-col">
        {/* Header with tabs */}
        <header className="border-b border-[var(--border)]">
          <div className="flex items-center gap-3 px-4 py-3">
            {activeTab === "chat" && (
              <button
                onClick={() => setShowSidebar(!showSidebar)}
                className="rounded-lg p-1.5 text-[var(--muted-foreground)] transition-colors hover:bg-[var(--accent)] hover:text-[var(--foreground)]"
                title={showSidebar ? "Hide sidebar" : "Show sidebar"}
              >
                <SidebarIcon size={18} />
              </button>
            )}
            <div className="flex-1">
              <h1 className="text-lg font-bold text-[var(--foreground)]">
                Brain
              </h1>
            </div>
          </div>
          <div className="flex gap-0 px-4">
            <button
              onClick={() => setActiveTab("chat")}
              className={`border-b-2 px-4 pb-2 text-sm font-medium transition-colors ${
                activeTab === "chat"
                  ? "border-[var(--primary)] text-[var(--primary)]"
                  : "border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              }`}
            >
              Chat
            </button>
            <button
              onClick={() => setActiveTab("knowledge")}
              className={`border-b-2 px-4 pb-2 text-sm font-medium transition-colors ${
                activeTab === "knowledge"
                  ? "border-[var(--primary)] text-[var(--primary)]"
                  : "border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              }`}
            >
              Knowledge
            </button>
          </div>
        </header>

        {activeTab === "chat" && (<>
        {/* Chat tab — Messages */}
        <div className="flex-1 overflow-auto">
          {messages.length === 0 && !loadingMessages ? (
            <div className="flex h-full flex-col items-center justify-center px-6">
              <div className="mb-6 text-[var(--muted-foreground)] opacity-30">
                <BrainLargeIcon size={80} />
              </div>
              <h2 className="text-xl font-bold text-[var(--foreground)]">
                Ask your Second Brain
              </h2>
              <p className="mt-2 max-w-md text-center text-sm text-[var(--muted-foreground)]">
                I have access to your meetings, emails, decisions, action
                items, and Kanban boards. Ask questions or manage tasks.
              </p>
              <div className="mt-6 grid max-w-lg gap-2 sm:grid-cols-2">
                {[
                  "What were the key decisions from my last meeting?",
                  "Summarize my open action items",
                  "Create a task to review Q1 metrics due Friday",
                  "Show me all high priority cards",
                  "What topics came up most in recent meetings?",
                  "Any overdue action items I should follow up on?",
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => {
                      setInput(suggestion);
                      inputRef.current?.focus();
                    }}
                    className="rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2.5 text-left text-xs text-[var(--muted-foreground)] transition-colors hover:border-[var(--primary)] hover:text-[var(--foreground)]"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          ) : loadingMessages ? (
            <div className="flex h-full items-center justify-center">
              <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
                <LoadingDots />
                Loading conversation...
              </div>
            </div>
          ) : (
            <div className="mx-auto max-w-3xl px-4 py-6">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`mb-6 flex gap-3 ${
                    msg.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {msg.role === "assistant" && (
                    <div className="mt-1 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-[var(--primary)]/10 text-[var(--primary)]">
                      <BrainSmallIcon size={16} />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                      msg.role === "user"
                        ? "bg-[var(--primary)] text-white"
                        : "bg-[var(--card)] border border-[var(--border)]"
                    }`}
                  >
                    {msg.role === "user" ? (
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">
                        {msg.content}
                      </p>
                    ) : (
                      <div>{renderMarkdown(msg.content)}</div>
                    )}
                    {msg.role === "assistant" &&
                      msg.sourcesUsed &&
                      msg.sourcesUsed.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1 border-t border-[var(--border)] pt-2">
                          {msg.sourcesUsed.map((src) => (
                            <span
                              key={src}
                              className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${
                                SOURCE_COLORS[src] || "bg-gray-100 text-gray-700"
                              }`}
                            >
                              {SOURCE_LABELS[src] || src}
                            </span>
                          ))}
                        </div>
                      )}
                  </div>
                  {msg.role === "user" && (
                    <div className="mt-1 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--foreground)]">
                      <UserIcon size={14} />
                    </div>
                  )}
                </div>
              ))}

              {sending && (
                <div className="mb-6 flex gap-3">
                  <div className="mt-1 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-[var(--primary)]/10 text-[var(--primary)]">
                    <BrainSmallIcon size={16} />
                  </div>
                  <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] px-4 py-3">
                    <LoadingDots />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input area */}
        <div className="border-t border-[var(--border)] bg-[var(--background)] px-4 py-3">
          <div className="mx-auto flex max-w-3xl items-end gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask your second brain..."
              rows={1}
              className="flex-1 resize-none rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:border-[var(--primary)] focus:outline-none"
              style={{
                minHeight: "44px",
                maxHeight: "120px",
                height: "auto",
              }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = "auto";
                target.style.height = Math.min(target.scrollHeight, 120) + "px";
              }}
              disabled={sending}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || sending}
              className="flex h-[44px] w-[44px] flex-shrink-0 items-center justify-center rounded-xl bg-[var(--primary)] text-white transition-colors hover:opacity-90 disabled:opacity-40"
              title="Send message"
            >
              <SendIcon size={18} />
            </button>
          </div>
          <p className="mt-1.5 text-center text-[10px] text-[var(--muted-foreground)]">
            Brain searches your data and manages Kanban tasks — try
            &quot;create a task&quot; or ask about your meetings
          </p>
        </div>
        </>)}

        {/* Knowledge tab */}
        {activeTab === "knowledge" && (
          <div className="flex-1 overflow-auto">
            {/* Filter bar */}
            <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-[var(--border)] bg-[var(--background)] px-6 py-3">
              <span className="text-xs font-medium text-[var(--muted-foreground)]">
                Filter:
              </span>
              {[
                { value: "", label: "All" },
                { value: "web_clip", label: "Web Clips" },
                { value: "zapier", label: "Zapier" },
                { value: "manual", label: "Manual" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setSourceFilter(opt.value)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    sourceFilter === opt.value
                      ? "bg-[var(--primary)] text-white"
                      : "bg-[var(--accent)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
              <span className="ml-auto text-xs text-[var(--muted-foreground)]">
                {thoughtsTotal} {thoughtsTotal === 1 ? "entry" : "entries"}
              </span>
            </div>

            {loadingThoughts ? (
              <div className="flex items-center justify-center py-20">
                <LoadingDots />
              </div>
            ) : thoughts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 px-6">
                <div className="mb-4 text-[var(--muted-foreground)] opacity-30">
                  <GlobeIcon size={48} />
                </div>
                <h2 className="text-lg font-bold text-[var(--foreground)]">
                  No knowledge entries yet
                </h2>
                <p className="mt-2 max-w-md text-center text-sm text-[var(--muted-foreground)]">
                  Use the Krisp Web Clipper extension to save web pages, or
                  connect Zapier to capture knowledge automatically.
                </p>
              </div>
            ) : (
              <div className="mx-auto max-w-3xl space-y-3 px-6 py-4">
                {thoughts.map((t) => (
                  <ThoughtCard key={t.id} thought={t} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Thought Card Component ──────────────────────────

function ThoughtCard({ thought }: { thought: BrainThought }) {
  // Extract a display title from content (first line)
  const lines = (thought.content || "").split("\n");
  const title = lines[0]?.slice(0, 120) || "Untitled";

  // Get preview text (skip title and source line)
  const bodyLines = lines.slice(1).filter((l) => !l.startsWith("Source: "));
  const preview = bodyLines.join("\n").trim().slice(0, 200);

  const sourceLabel =
    thought.source === "web_clip"
      ? "Web Clip"
      : thought.source === "zapier"
        ? "Zapier"
        : "Manual";

  const date = thought.createdAt
    ? new Date(thought.createdAt).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : "";

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 transition-colors hover:border-[var(--primary)]/30">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-[var(--accent)]">
          {thought.source === "web_clip" ? (
            <GlobeIcon size={16} />
          ) : thought.source === "zapier" ? (
            <ZapIcon size={16} />
          ) : (
            <EditIcon size={16} />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${
              thought.source === "web_clip"
                ? "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400"
                : thought.source === "zapier"
                  ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                  : "bg-gray-100 text-gray-700 dark:bg-gray-800/30 dark:text-gray-400"
            }`}>
              {sourceLabel}
            </span>
            {thought.topic && (
              <span className="text-xs text-[var(--muted-foreground)]">
                {thought.topic}
              </span>
            )}
            <span className="ml-auto text-[10px] text-[var(--muted-foreground)]">
              {date}
            </span>
          </div>

          <h3 className="mt-1 text-sm font-semibold text-[var(--foreground)] leading-snug">
            {title}
          </h3>

          {thought.sourceUrl && (
            <a
              href={thought.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 block truncate text-xs text-[var(--primary)] hover:underline"
            >
              {thought.sourceDomain || thought.sourceUrl}
            </a>
          )}

          {preview && (
            <p className="mt-1.5 text-xs leading-relaxed text-[var(--muted-foreground)] line-clamp-3">
              {preview}
            </p>
          )}

          {Array.isArray(thought.tags) && thought.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {(thought.tags as string[]).map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-[var(--accent)] px-2 py-0.5 text-[10px] text-[var(--muted-foreground)]"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Icons ───────────────────────────────────────────
function ChatBubbleIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function TrashIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
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

function SidebarIcon({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
      <line x1="9" x2="9" y1="3" y2="21" />
    </svg>
  );
}

function SendIcon({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="22" x2="11" y1="2" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}

function UserIcon({ size = 14 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function BrainLargeIcon({ size = 80 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
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

function BrainSmallIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
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
    </svg>
  );
}

function GlobeIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}

function ZapIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}

function EditIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function LoadingDots() {
  return (
    <span className="inline-flex items-center gap-1">
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--muted-foreground)] [animation-delay:-0.3s]" />
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--muted-foreground)] [animation-delay:-0.15s]" />
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--muted-foreground)]" />
    </span>
  );
}
