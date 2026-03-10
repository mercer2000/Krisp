"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { EmailChipInput } from "./EmailChipInput";
import { MarkdownCompose } from "./MarkdownCompose";
import { useToast } from "@/components/ui/Toast";

export type ComposeAction = "reply" | "reply_all" | "forward";
export type ContextLevel = "email_only" | "full_thread" | "thread_and_app";

interface ComposePaneProps {
  emailId: number | string;
  action: ComposeAction;
  aiMode: boolean;
  /** Pre-populated recipients */
  defaultTo: string[];
  defaultCc: string[];
  onClose: () => void;
  onSent: () => void;
}

export function ComposePane({
  emailId,
  action,
  aiMode,
  defaultTo,
  defaultCc,
  onClose,
  onSent,
}: ComposePaneProps) {
  const { toast } = useToast();
  const paneRef = useRef<HTMLDivElement>(null);

  // Recipient state
  const [to, setTo] = useState<string[]>(defaultTo);
  const [cc, setCc] = useState<string[]>(defaultCc);
  const [bcc, setBcc] = useState<string[]>([]);
  const [showCc, setShowCc] = useState(defaultCc.length > 0);
  const [showBcc, setShowBcc] = useState(false);

  // Compose state
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  // AI state
  const [contextLevel, setContextLevel] = useState<ContextLevel>("email_only");
  const [generating, setGenerating] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [intent, setIntent] = useState<string | null>(null);
  const userEdited = useRef(false);

  // Auto-generate AI draft on mount if in AI mode
  useEffect(() => {
    if (!aiMode) return;
    generateDraft();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const generateDraft = useCallback(async () => {
    setGenerating(true);
    try {
      const res = await fetch(`/api/emails/${emailId}/reply-draft`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: action === "reply_all" ? "reply_all" : action,
          contextLevel,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (data.error) {
          toast({ title: "Draft generation failed", description: data.error, variant: "destructive" });
        }
        return;
      }
      const data = await res.json();
      if (!userEdited.current && data.draft) {
        setBody(data.draft);
      }
      if (data.intent) setIntent(data.intent);
      setHasGenerated(true);
    } catch {
      toast({ title: "Failed to generate draft", variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  }, [emailId, action, contextLevel, toast]);

  const handleSend = async () => {
    if (!body.trim()) {
      toast({ title: "Message body is required", variant: "destructive" });
      return;
    }
    if (action === "forward" && to.length === 0) {
      toast({ title: "At least one recipient is required", variant: "destructive" });
      return;
    }

    setSending(true);
    try {
      const endpoint =
        action === "reply"
          ? `/api/emails/${emailId}/reply`
          : action === "reply_all"
            ? `/api/emails/${emailId}/reply-all`
            : `/api/emails/${emailId}/forward`;

      const payload: Record<string, unknown> = {
        bodyMarkdown: body,
      };
      if (to.length) payload.to = to;
      if (cc.length) payload.cc = cc;
      if (bcc.length) payload.bcc = bcc;

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to send");
      }

      const actionLabel =
        action === "reply" ? "Reply" : action === "reply_all" ? "Reply all" : "Forward";
      toast({ title: `${actionLabel} sent`, variant: "success" });
      onSent();
    } catch (err) {
      toast({
        title: "Send failed",
        description: err instanceof Error ? err.message : "Failed to send",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  // Cmd/Ctrl+Enter to send
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        handleSend();
      }
      if (e.key === "Escape") {
        // If a compose field is focused, blur it first
        const active = document.activeElement;
        if (
          active &&
          paneRef.current?.contains(active) &&
          (active.tagName === "INPUT" || active.tagName === "TEXTAREA")
        ) {
          (active as HTMLElement).blur();
          e.stopPropagation();
          return;
        }
        onClose();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [body, to, cc, bcc, sending]);

  const actionLabel =
    action === "reply" ? "Reply" : action === "reply_all" ? "Reply All" : "Forward";

  return (
    <div
      ref={paneRef}
      className="border-t border-[var(--border)] bg-[var(--background)] px-3 py-3 md:px-6 md:py-4 space-y-3"
      data-compose-pane
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium text-[var(--foreground)]">{actionLabel}</h3>
          {intent && !generating && (
            <span
              className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] font-medium"
              title={`AI detected intent: ${intent.replace("_", " ")}`}
            >
              {intent.replace("_", " ")}
            </span>
          )}
        </div>
      </div>

      {/* Recipients */}
      <div className="space-y-1.5">
        <EmailChipInput
          label="To"
          emails={to}
          onChange={setTo}
          autoFocus={action === "forward"}
        />

        {showCc && (
          <EmailChipInput label="CC" emails={cc} onChange={setCc} />
        )}

        {showBcc && (
          <EmailChipInput label="BCC" emails={bcc} onChange={setBcc} />
        )}

        {(!showCc || !showBcc) && (
          <div className="flex gap-2 pl-10">
            {!showCc && (
              <button
                type="button"
                onClick={() => setShowCc(true)}
                className="text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
              >
                +CC
              </button>
            )}
            {!showBcc && (
              <button
                type="button"
                onClick={() => setShowBcc(true)}
                className="text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
              >
                +BCC
              </button>
            )}
          </div>
        )}
      </div>

      {/* AI context selector + regenerate */}
      {aiMode && (
        <div className="flex items-center gap-2 flex-wrap">
          <label className="text-xs text-[var(--muted-foreground)]">Context:</label>
          <select
            value={contextLevel}
            onChange={(e) => setContextLevel(e.target.value as ContextLevel)}
            className="text-xs px-2 py-1 rounded-md border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] outline-none"
          >
            <option value="email_only">This email</option>
            <option value="full_thread">Full thread</option>
            <option value="thread_and_app">Thread + my data</option>
          </select>
          <button
            type="button"
            onClick={() => {
              userEdited.current = false;
              setBody("");
              generateDraft();
            }}
            disabled={generating}
            className="text-xs text-[var(--primary)] hover:underline disabled:opacity-40"
          >
            {hasGenerated ? "Regenerate" : "Draft with AI"}
          </button>
        </div>
      )}

      {/* Markdown editor */}
      <MarkdownCompose
        value={body}
        onChange={(v) => {
          userEdited.current = true;
          setBody(v);
        }}
        generating={generating}
        autoFocus={action !== "forward"}
      />

      {/* Actions */}
      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="px-3 py-1.5 text-sm font-medium rounded-lg border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--accent)] transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSend}
          disabled={sending || !body.trim() || (action === "forward" && to.length === 0)}
          className="px-3 py-1.5 text-sm font-medium rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 transition-opacity disabled:opacity-40"
        >
          {sending ? "Sending..." : `Send ${actionLabel}`}{" "}
          <kbd className="text-[10px] ml-1 opacity-70">
            {typeof navigator !== "undefined" && navigator.platform?.includes("Mac") ? "\u2318" : "Ctrl"}\u21b5
          </kbd>
        </button>
      </div>
    </div>
  );
}
