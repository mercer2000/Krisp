"use client";

import { useState, useEffect, useCallback } from "react";

export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="ml-2 px-3 py-1.5 text-xs font-medium rounded-md border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] hover:bg-[var(--accent)] transition-colors"
    >
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

export function CodeBlock({ children }: { children: string }) {
  return (
    <div className="relative group">
      <pre className="p-4 rounded-lg bg-[var(--secondary)] border border-[var(--border)] text-sm text-[var(--foreground)] overflow-x-auto">
        <code>{children}</code>
      </pre>
      <div className="absolute top-2 right-2">
        <CopyButton text={children} />
      </div>
    </div>
  );
}

export const FIELD_MAPPING = [
  { powerAutomate: "From", payload: "from", description: "Sender email address" },
  { powerAutomate: "To", payload: "to", description: 'Array of recipient addresses (wrap in [" "] if single)' },
  { powerAutomate: "CC", payload: "cc", description: "Array of CC addresses (optional)" },
  { powerAutomate: "Subject", payload: "subject", description: "Email subject line" },
  { powerAutomate: "Body Preview / Body", payload: "bodyPlainText", description: "Plain text body" },
  { powerAutomate: "Body (HTML)", payload: "bodyHtml", description: "HTML body content" },
  { powerAutomate: "Received Time", payload: "receivedDateTime", description: "ISO 8601 timestamp" },
  { powerAutomate: "Message Id", payload: "messageId", description: "Unique message identifier (required for dedup)" },
  { powerAutomate: "Has Attachment + Attachments", payload: "attachments", description: "Array of {name, contentType, size}" },
];

export const CRISP_EVENTS = [
  { event: "key_points_generated", description: "Fired when Crisp extracts key points from a completed meeting" },
  { event: "transcript_created", description: "Fired when a full meeting transcript becomes available" },
];

export function WebhookSecretManager() {
  const [maskedSecret, setMaskedSecret] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchSecret = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/webhook-secret");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setMaskedSecret(data.secret);
    } catch {
      setError("Failed to load webhook secret");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSecret();
  }, [fetchSecret]);

  const handleSave = async () => {
    if (!inputValue.trim()) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch("/api/webhook-secret", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret: inputValue.trim() }),
      });
      if (!res.ok) throw new Error("Failed to save");
      setInputValue("");
      setSuccess("Webhook secret saved");
      setTimeout(() => setSuccess(null), 3000);
      await fetchSecret();
    } catch {
      setError("Failed to save webhook secret");
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async () => {
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch("/api/webhook-secret", { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to remove");
      setMaskedSecret(null);
      setSuccess("Webhook secret removed");
      setTimeout(() => setSuccess(null), 3000);
    } catch {
      setError("Failed to remove webhook secret");
    }
  };

  return (
    <div>
      <h3 className="text-sm font-semibold text-[var(--foreground)] mb-2">
        Authentication
      </h3>
      <p className="text-sm text-[var(--muted-foreground)] mb-3">
        Enter the{" "}
        <code className="px-1.5 py-0.5 rounded bg-[var(--secondary)] text-[var(--foreground)] text-xs">
          Authorization
        </code>{" "}
        secret from your Krisp webhook configuration. Krisp sends this value
        in the request header with every webhook call so the server can
        authenticate it.
      </p>

      {error && (
        <div className="mb-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-600">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-3 p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-sm text-green-600">
          {success}
        </div>
      )}

      {loading ? (
        <div className="p-4 rounded-lg bg-[var(--secondary)] border border-[var(--border)] text-sm text-[var(--muted-foreground)]">
          Loading...
        </div>
      ) : (
        <div className="space-y-3">
          {/* Current secret display */}
          {maskedSecret && (
            <div>
              <label className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">
                Current Secret
              </label>
              <div className="mt-1 flex items-center gap-2 p-3 rounded-lg bg-[var(--secondary)] border border-[var(--border)]">
                <code className="flex-1 text-sm text-[var(--foreground)] font-mono">
                  {maskedSecret}
                </code>
                <button
                  onClick={handleRemove}
                  className="shrink-0 px-3 py-1.5 text-xs font-medium rounded-md border border-red-500/30 text-red-600 hover:bg-red-500/10 transition-colors"
                >
                  Remove
                </button>
              </div>
            </div>
          )}

          {/* Secret input */}
          <div>
            <label className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">
              {maskedSecret ? "Update Secret" : "Webhook Secret"}
            </label>
            <div className="mt-1 flex items-center gap-2">
              <input
                type="password"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Paste your Krisp Authorization secret here"
                className="flex-1 px-3 py-2 text-sm rounded-md border border-[var(--border)] bg-[var(--secondary)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSave();
                }}
              />
              <button
                onClick={handleSave}
                disabled={saving || !inputValue.trim()}
                className="shrink-0 px-4 py-2 text-sm font-medium rounded-md bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface BoardOption {
  id: string;
  title: string;
}

export function DefaultBoardSelector() {
  const [boards, setBoards] = useState<BoardOption[]>([]);
  const [selectedBoardId, setSelectedBoardId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/v1/boards").then((r) => (r.ok ? r.json() : [])),
      fetch("/api/settings/default-board").then((r) => (r.ok ? r.json() : { defaultBoardId: null })),
    ])
      .then(([boardsData, settingsData]) => {
        setBoards(Array.isArray(boardsData) ? boardsData : []);
        setSelectedBoardId(settingsData.defaultBoardId ?? null);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (boardId: string | null) => {
    setSelectedBoardId(boardId);
    setSaving(true);
    setSuccess(null);
    try {
      const res = await fetch("/api/settings/default-board", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ boardId }),
      });
      if (res.ok) {
        setSuccess("Default board updated");
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch {
      // silently fail
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-[var(--secondary)] rounded w-1/3 mb-2" />
        <div className="h-10 bg-[var(--secondary)] rounded w-full" />
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-sm font-semibold text-[var(--foreground)] mb-2">
        Default Kanban Board
      </h3>
      <p className="text-sm text-[var(--muted-foreground)] mb-3">
        Action items extracted from meetings will automatically create cards on this board
        when the assignee matches your account. Select a board to enable auto-assignment.
      </p>
      <div className="flex items-center gap-3">
        <select
          value={selectedBoardId || ""}
          onChange={(e) => handleSave(e.target.value || null)}
          disabled={saving}
          className="flex-1 max-w-sm px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] disabled:opacity-50"
        >
          <option value="">No board (auto-assignment disabled)</option>
          {boards.map((b) => (
            <option key={b.id} value={b.id}>
              {b.title}
            </option>
          ))}
        </select>
        {saving && (
          <svg className="animate-spin h-4 w-4 text-[var(--muted-foreground)]" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
        {success && (
          <span className="text-xs text-green-600 font-medium">{success}</span>
        )}
      </div>
      {boards.length === 0 && (
        <p className="text-xs text-[var(--muted-foreground)] mt-2">
          No Kanban boards found. Create a board first to enable auto-assignment.
        </p>
      )}
    </div>
  );
}
