"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { MessageCircle, X, Send, Loader2, UserRound } from "lucide-react";
import ReactMarkdown from "react-markdown";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface WidgetConfig {
  agentName: string;
  agentRole: string;
  avatarUrl: string;
  welcomeMessage: string;
  starterButtons: Array<{ label: string; message: string }>;
  primaryColor: string;
  iconStyle: "modern" | "classic";
  bubbleSize: "small" | "medium" | "large";
  position: "bottom-right" | "bottom-left";
  zIndex: number;
}

type SessionStatus =
  | "ai_only"
  | "pending_agent"
  | "agent_active"
  | "agent_closed"
  | "ticket_created";

interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "agent" | "system";
  content: string;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const BUBBLE_SIZES: Record<WidgetConfig["bubbleSize"], number> = {
  small: 48,
  medium: 56,
  large: 64,
};

const SESSION_STORAGE_KEY = "support-chat-session-id";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generateId(): string {
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// ---------------------------------------------------------------------------
// Classic chat bubble SVG icon
// ---------------------------------------------------------------------------

function ClassicChatIcon({ size }: { size: number }) {
  const iconSize = Math.round(size * 0.5);
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={iconSize}
      height={iconSize}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function SupportChatWidget() {
  // ---- State --------------------------------------------------------------
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState<WidgetConfig | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [showWelcome, setShowWelcome] = useState(true);
  const [sessionStatus, setSessionStatus] = useState<SessionStatus>("ai_only");
  const [agentsOnline, setAgentsOnline] = useState(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const agentCheckRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ---- Refs ---------------------------------------------------------------
  const bubbleRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const sendButtonRef = useRef<HTMLButtonElement>(null);

  // ---- Fetch config on mount ----------------------------------------------
  useEffect(() => {
    let cancelled = false;

    async function fetchConfig() {
      try {
        const res = await fetch("/api/support-chat/widget-config");
        if (!res.ok) return;
        const data: WidgetConfig = await res.json();
        if (!cancelled) setConfig(data);
      } catch {
        // Config fetch failed; widget will remain hidden
      }
    }

    fetchConfig();

    // Restore session from sessionStorage
    const stored = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (stored) setSessionId(stored);

    return () => {
      cancelled = true;
    };
  }, []);

  // ---- Update showWelcome when messages change ----------------------------
  useEffect(() => {
    if (messages.length > 0) setShowWelcome(false);
  }, [messages]);

  // ---- Auto-scroll on new messages ----------------------------------------
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // ---- Focus management on open/close -------------------------------------
  useEffect(() => {
    if (isOpen) {
      // Focus input when panel opens
      requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
    }
  }, [isOpen]);

  // ---- Escape key to close ------------------------------------------------
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        setIsOpen(false);
        bubbleRef.current?.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // ---- Focus trap ---------------------------------------------------------
  useEffect(() => {
    if (!isOpen || !panelRef.current) return;

    function handleTabKey(e: KeyboardEvent) {
      if (e.key !== "Tab" || !panelRef.current) return;

      const focusable = panelRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );

      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    document.addEventListener("keydown", handleTabKey);
    return () => document.removeEventListener("keydown", handleTabKey);
  }, [isOpen]);

  // ---- Agent availability check (every 60s) --------------------------------
  useEffect(() => {
    async function checkAgents() {
      try {
        const res = await fetch("/api/support-chat/agents-online");
        if (res.ok) {
          const data = await res.json();
          setAgentsOnline(data.online);
        }
      } catch {
        // Ignore errors
      }
    }

    checkAgents();
    agentCheckRef.current = setInterval(checkAgents, 60_000);

    return () => {
      if (agentCheckRef.current) clearInterval(agentCheckRef.current);
    };
  }, []);

  // ---- Poll for new messages when pending_agent or agent_active -----------
  useEffect(() => {
    if (
      !sessionId ||
      (sessionStatus !== "pending_agent" && sessionStatus !== "agent_active")
    ) {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
      return;
    }

    async function pollMessages() {
      if (!sessionId) return;
      try {
        const lastMsg = messages[messages.length - 1];
        const since = lastMsg?.createdAt ?? "";
        const url = `/api/support-chat/session/${sessionId}/messages${since ? `?since=${encodeURIComponent(since)}` : ""}`;
        const res = await fetch(url);
        if (!res.ok) return;
        const data = await res.json();

        if (data.sessionStatus) {
          setSessionStatus(data.sessionStatus);
        }

        if (data.messages?.length > 0) {
          setMessages((prev) => {
            const existingIds = new Set(prev.map((m) => m.id));
            const newMsgs = data.messages.filter(
              (m: ChatMessage) => !existingIds.has(m.id)
            );
            return newMsgs.length > 0 ? [...prev, ...newMsgs] : prev;
          });
        }
      } catch {
        // Ignore polling errors
      }
    }

    pollingRef.current = setInterval(pollMessages, 3_000);

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [sessionId, sessionStatus, messages]);

  // ---- Request human agent ------------------------------------------------
  const requestHumanAgent = useCallback(async () => {
    if (!sessionId) return;

    try {
      const res = await fetch("/api/support-chat/request-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });

      if (!res.ok) throw new Error("Failed to request agent");

      const data = await res.json();
      setSessionStatus(data.status);
    } catch {
      const errorMessage: ChatMessage = {
        id: generateId(),
        role: "system",
        content: "Sorry, we couldn't connect you to an agent right now.",
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    }
  }, [sessionId]);

  // ---- Reset session (start new conversation) -----------------------------
  const resetSession = useCallback(() => {
    setSessionId(null);
    setMessages([]);
    setSessionStatus("ai_only");
    setShowWelcome(true);
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
  }, []);

  // ---- Send message -------------------------------------------------------
  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isLoading || !config) return;

      const userMessage: ChatMessage = {
        id: generateId(),
        role: "user",
        content: text.trim(),
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setInputValue("");
      setIsLoading(true);
      setShowWelcome(false);

      try {
        // Ensure we have a session
        let currentSessionId = sessionId;
        if (!currentSessionId) {
          const sessionRes = await fetch("/api/support-chat/session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              pageUrl: window.location.href,
              userAgent: navigator.userAgent,
              referrer: document.referrer,
            }),
          });
          if (!sessionRes.ok) throw new Error("Failed to create session");
          const sessionData = await sessionRes.json();
          currentSessionId = sessionData.sessionId;
          setSessionId(currentSessionId);
          sessionStorage.setItem(SESSION_STORAGE_KEY, currentSessionId!);
        }

        // Send the message
        const res = await fetch("/api/support-chat/message", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId: currentSessionId,
            message: text.trim(),
          }),
        });

        if (!res.ok) throw new Error("Failed to send message");

        const data = await res.json();

        // When agent is active, the API returns an empty response (agent replies via polling)
        if (data.response) {
          const assistantMessage: ChatMessage = {
            id: generateId(),
            role: "assistant",
            content: data.response,
            createdAt: new Date().toISOString(),
          };

          setMessages((prev) => [...prev, assistantMessage]);
        }
      } catch {
        const errorMessage: ChatMessage = {
          id: generateId(),
          role: "assistant",
          content:
            "Sorry, something went wrong. Please try again or contact us directly.",
          createdAt: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
        // Re-focus input after response
        requestAnimationFrame(() => {
          inputRef.current?.focus();
        });
      }
    },
    [sessionId, isLoading, config]
  );

  // ---- Handle input submit ------------------------------------------------
  const handleSubmit = useCallback(
    (e?: React.FormEvent) => {
      e?.preventDefault();
      sendMessage(inputValue);
    },
    [inputValue, sendMessage]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  // ---- Toggle panel -------------------------------------------------------
  const togglePanel = useCallback(() => {
    setIsOpen((prev) => {
      if (prev) {
        // Closing — return focus to bubble
        requestAnimationFrame(() => bubbleRef.current?.focus());
      }
      return !prev;
    });
  }, []);

  // ---- Don't render until config is loaded --------------------------------
  if (!config) return null;

  // ---- Computed values ----------------------------------------------------
  const bubbleSizePx = BUBBLE_SIZES[config.bubbleSize];
  const iconSize = Math.round(bubbleSizePx * 0.5);
  const positionSide =
    config.position === "bottom-left" ? "left" : "right";

  // ---- Styles -------------------------------------------------------------
  const bubbleStyle: React.CSSProperties = {
    position: "fixed",
    [positionSide]: "24px",
    bottom: "24px",
    zIndex: config.zIndex,
    width: `${bubbleSizePx}px`,
    height: `${bubbleSizePx}px`,
    borderRadius: "50%",
    backgroundColor: config.primaryColor,
    color: "white",
    border: "none",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
    transition: "transform 0.2s, box-shadow 0.2s",
  };

  const panelStyle: React.CSSProperties = {
    position: "fixed",
    [positionSide]: "24px",
    bottom: `${bubbleSizePx + 36}px`,
    zIndex: config.zIndex,
    width: "380px",
    maxHeight: "520px",
    borderRadius: "16px",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
  };

  // ---- Render -------------------------------------------------------------
  return (
    <>
      {/* ---- Chat panel ------------------------------------------------- */}
      {isOpen && (
        <div
          ref={panelRef}
          role="dialog"
          aria-label="Support chat"
          aria-modal="true"
          style={panelStyle}
          className="border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)]"
        >
          {/* Header */}
          <div
            className="flex shrink-0 items-center gap-3 px-4 py-3"
            style={{ backgroundColor: config.primaryColor }}
          >
            {config.avatarUrl ? (
              <img
                src={config.avatarUrl}
                alt={config.agentName}
                className="h-9 w-9 rounded-full object-cover ring-2 ring-white/20"
              />
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20">
                <MessageCircle size={18} className="text-white" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-white truncate">
                {config.agentName}
              </p>
              <p className="text-xs text-white/70 truncate">
                {config.agentRole}
              </p>
            </div>
            <button
              ref={closeButtonRef}
              type="button"
              onClick={togglePanel}
              className="rounded-md p-1.5 text-white/80 transition-colors hover:bg-white/20 hover:text-white focus:outline-2 focus:outline-offset-2 focus:outline-white"
              aria-label="Close support chat"
            >
              <X size={18} />
            </button>
          </div>

          {/* Messages area */}
          <div
            className="flex-1 overflow-y-auto px-4 py-4 space-y-3"
            aria-live="polite"
            style={{ minHeight: "200px" }}
          >
            {/* Welcome screen */}
            {showWelcome && (
              <div className="flex flex-col items-center text-center py-4">
                {config.avatarUrl ? (
                  <img
                    src={config.avatarUrl}
                    alt={config.agentName}
                    className="h-16 w-16 rounded-full object-cover mb-3 ring-2 ring-[var(--border)]"
                  />
                ) : (
                  <div
                    className="flex h-16 w-16 items-center justify-center rounded-full mb-3"
                    style={{ backgroundColor: config.primaryColor }}
                  >
                    <MessageCircle size={28} className="text-white" />
                  </div>
                )}

                <h3 className="text-base font-semibold text-[var(--foreground)] mb-1">
                  {config.agentName}
                </h3>

                <p className="text-sm text-[var(--muted-foreground)] mb-5 px-4 leading-relaxed">
                  {config.welcomeMessage}
                </p>

                {config.starterButtons.length > 0 && (
                  <div className="flex flex-wrap justify-center gap-2 px-2">
                    {config.starterButtons.map((btn, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => sendMessage(btn.message)}
                        className="rounded-full border border-[var(--border)] bg-[var(--card)] px-3.5 py-2 text-sm text-[var(--foreground)] transition-colors hover:bg-[var(--accent)] focus:outline-2 focus:outline-offset-2"
                        style={{
                          // @ts-expect-error -- CSS custom property for focus color
                          "--tw-outline-color": config.primaryColor,
                        }}
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Message list */}
            {messages.map((msg) => {
              // System messages: centered, muted, italic
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
              const isAgent = msg.role === "agent";

              return (
                <div
                  key={msg.id}
                  className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                      isUser
                        ? "ml-auto text-white"
                        : "mr-auto bg-gray-100 dark:bg-gray-800 text-[var(--foreground)]"
                    }`}
                    style={
                      isUser
                        ? { backgroundColor: config.primaryColor }
                        : {}
                    }
                  >
                    {isAgent && (
                      <p className="text-xs font-medium mb-1 opacity-70">
                        Agent
                      </p>
                    )}
                    {msg.role === "assistant" || isAgent ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none [&_p]:my-1 [&_ul]:my-1 [&_ol]:my-1 [&_li]:my-0.5 [&_a]:underline">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    ) : (
                      msg.content
                    )}
                  </div>
                </div>
              );
            })}

            {/* Typing indicator */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="flex items-center gap-1 mr-auto bg-gray-100 dark:bg-gray-800 rounded-2xl px-4 py-3">
                  <span
                    className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"
                    style={{ animationDelay: "0ms" }}
                  />
                  <span
                    className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"
                    style={{ animationDelay: "150ms" }}
                  />
                  <span
                    className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"
                    style={{ animationDelay: "300ms" }}
                  />
                </div>
              </div>
            )}

            {/* Scroll anchor */}
            <div ref={messagesEndRef} />
          </div>

          {/* Agent closed / ticket created state */}
          {(sessionStatus === "agent_closed" ||
            sessionStatus === "ticket_created") && (
            <div className="shrink-0 border-t border-[var(--border)] px-4 py-3 text-center">
              <button
                type="button"
                onClick={resetSession}
                className="rounded-xl px-4 py-2 text-sm font-medium text-white transition-colors"
                style={{ backgroundColor: config.primaryColor }}
              >
                Start new conversation
              </button>
            </div>
          )}

          {/* Pending agent indicator */}
          {sessionStatus === "pending_agent" && (
            <div className="shrink-0 border-t border-[var(--border)] px-4 py-3">
              <div className="flex items-center justify-center gap-2 text-sm text-[var(--muted-foreground)]">
                <Loader2 size={14} className="animate-spin" />
                <span>Waiting for an agent...</span>
              </div>
            </div>
          )}

          {/* Input area (shown for ai_only and agent_active) */}
          {(sessionStatus === "ai_only" ||
            sessionStatus === "agent_active") && (
            <div className="shrink-0 border-t border-[var(--border)]">
              {/* Talk to a person button */}
              {agentsOnline &&
                sessionStatus === "ai_only" &&
                sessionId &&
                messages.length > 0 && (
                  <div className="flex justify-center px-4 pt-2">
                    <button
                      type="button"
                      onClick={requestHumanAgent}
                      className="flex items-center gap-1.5 rounded-full border border-[var(--border)] px-3 py-1.5 text-xs text-[var(--muted-foreground)] transition-colors hover:bg-[var(--accent)] hover:text-[var(--foreground)]"
                    >
                      <UserRound size={12} />
                      Talk to a person
                    </button>
                  </div>
                )}

              <form
                onSubmit={handleSubmit}
                className="flex items-end gap-2 px-4 py-3"
              >
                <textarea
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type your message..."
                  aria-label="Type your message"
                  rows={1}
                  className="flex-1 resize-none rounded-xl border border-[var(--border)] bg-[var(--background)] px-3.5 py-2.5 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] transition-colors focus:outline-2 focus:outline-offset-0"
                  style={
                    {
                      maxHeight: "100px",
                      "--tw-outline-color": config.primaryColor,
                    } as React.CSSProperties
                  }
                  disabled={isLoading}
                />
                <button
                  ref={sendButtonRef}
                  type="submit"
                  disabled={!inputValue.trim() || isLoading}
                  aria-label="Send message"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed focus:outline-2 focus:outline-offset-2"
                  style={{
                    backgroundColor: config.primaryColor,
                    // @ts-expect-error -- CSS custom property for focus color
                    "--tw-outline-color": config.primaryColor,
                  }}
                >
                  {isLoading ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Send size={18} />
                  )}
                </button>
              </form>
            </div>
          )}
        </div>
      )}

      {/* ---- Bubble button ---------------------------------------------- */}
      <button
        ref={bubbleRef}
        type="button"
        onClick={togglePanel}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.08)";
          (e.currentTarget as HTMLButtonElement).style.boxShadow =
            "0 6px 20px rgba(0,0,0,0.2)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)";
          (e.currentTarget as HTMLButtonElement).style.boxShadow =
            "0 4px 12px rgba(0,0,0,0.15)";
        }}
        style={bubbleStyle}
        aria-label={isOpen ? "Close support chat" : "Open support chat"}
        className="focus:outline-2 focus:outline-offset-2 focus:outline-white"
      >
        {isOpen ? (
          <X size={iconSize} />
        ) : config.iconStyle === "classic" ? (
          <ClassicChatIcon size={bubbleSizePx} />
        ) : (
          <MessageCircle size={iconSize} />
        )}
      </button>
    </>
  );
}
