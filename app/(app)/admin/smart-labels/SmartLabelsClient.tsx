"use client";

import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/components/ui/Toast";

// ── Types ──────────────────────────────────────────────

interface SmartLabel {
  id: string;
  name: string;
  prompt: string;
  color: string;
  active: boolean;
  auto_draft_enabled: boolean;
  context_window_max: number;
  graph_folder_id: string | null;
  folder_sync_status: "none" | "pending" | "synced" | "failed" | "unlinked";
  outlook_account_id: string | null;
  created_at: string;
  updated_at: string;
}

interface ContextEntry {
  id: string;
  label_id: string;
  email_id: string;
  email_type: string;
  sender: string;
  subject: string | null;
  received_at: string;
  body_excerpt: string | null;
  user_replied: boolean;
  reply_excerpt: string | null;
  created_at: string;
}

const PRESET_COLORS = [
  "#EF4444", // red
  "#F97316", // orange
  "#F59E0B", // amber
  "#10B981", // emerald
  "#3B82F6", // blue
  "#6366F1", // indigo
  "#8B5CF6", // violet
  "#EC4899", // pink
];

// ── Icons ──────────────────────────────────────────────

function PlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" x2="12" y1="5" y2="19" />
      <line x1="5" x2="19" y1="12" y2="12" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18" />
      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
    </svg>
  );
}

function SaveIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
      <polyline points="17 21 17 13 7 13 7 21" />
      <polyline points="7 3 7 8 15 8" />
    </svg>
  );
}

function SparklesIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
    </svg>
  );
}

function ChevronDown({ open }: { open: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function BrainIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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

function FolderIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
      <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
      <path d="M16 16h5v5" />
    </svg>
  );
}

// ── Memory Viewer ──────────────────────────────────────

function MemoryViewer({
  labelId,
  labelName,
}: {
  labelId: string;
  labelName: string;
}) {
  const { toast } = useToast();
  const [entries, setEntries] = useState<ContextEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchEntries = useCallback(async () => {
    try {
      const res = await fetch(`/api/smart-labels/${labelId}/context`);
      const data = await res.json();
      if (data.data) setEntries(data.data);
    } catch {
      toast({ title: "Failed to load memory", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [labelId, toast]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const handleDelete = async (entryId: string) => {
    setDeletingId(entryId);
    try {
      const res = await fetch(`/api/smart-labels/${labelId}/context?entryId=${entryId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setEntries((prev) => prev.filter((e) => e.id !== entryId));
        toast({ title: "Entry removed", variant: "success" });
      } else {
        toast({ title: "Failed to remove entry", variant: "destructive" });
      }
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="py-3">
        <div className="animate-pulse space-y-2">
          <div className="h-12 rounded bg-[var(--hover-bg)]" />
          <div className="h-12 rounded bg-[var(--hover-bg)]" />
        </div>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="py-3 text-center">
        <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
          No memory entries yet for &quot;{labelName}&quot;. Entries are created automatically when emails are classified under this label.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2 py-2">
      <p className="text-[11px]" style={{ color: "var(--muted-foreground)" }}>
        {entries.length} memory {entries.length === 1 ? "entry" : "entries"} — used to calibrate auto-draft tone
      </p>
      {entries.map((entry) => (
        <div
          key={entry.id}
          className="flex items-start gap-2 p-2 rounded-md border text-xs"
          style={{ borderColor: "var(--border)", backgroundColor: "var(--background)" }}
        >
          <div className="flex-1 min-w-0 space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="font-medium truncate" style={{ color: "var(--foreground)" }}>
                {entry.sender}
              </span>
              <span className="flex-shrink-0" style={{ color: "var(--muted-foreground)" }}>
                {new Date(entry.received_at).toLocaleDateString()}
              </span>
              {entry.user_replied && (
                <span
                  className="text-[10px] px-1.5 py-0.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: "#10B98122", color: "#10B981" }}
                >
                  Replied
                </span>
              )}
            </div>
            {entry.subject && (
              <p className="truncate" style={{ color: "var(--muted-foreground)" }}>
                {entry.subject}
              </p>
            )}
            {entry.body_excerpt && (
              <p className="truncate" style={{ color: "var(--muted-foreground)", opacity: 0.7 }}>
                {entry.body_excerpt.slice(0, 100)}...
              </p>
            )}
            {entry.reply_excerpt && (
              <p className="truncate italic" style={{ color: "#3B82F6" }}>
                Reply: {entry.reply_excerpt.slice(0, 100)}...
              </p>
            )}
          </div>
          <button
            onClick={() => handleDelete(entry.id)}
            disabled={deletingId === entry.id}
            className="p-1 rounded text-[var(--muted-foreground)] hover:text-red-500 hover:bg-red-500/10 transition-colors flex-shrink-0 disabled:opacity-40"
            title="Remove from memory"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" x2="6" y1="6" y2="18" />
              <line x1="6" x2="18" y1="6" y2="18" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}

// ── Label Card ──────────────────────────────────────────

function LabelCard({
  label,
  onSave,
  onDelete,
  onToggle,
  onToggleDraft,
  onUpdateContextMax,
  onSyncFolder,
}: {
  label: SmartLabel;
  onSave: (id: string, updates: { name?: string; prompt?: string; color?: string }) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onToggle: (id: string, active: boolean) => Promise<void>;
  onToggleDraft: (id: string, enabled: boolean) => Promise<void>;
  onUpdateContextMax: (id: string, max: number) => Promise<void>;
  onSyncFolder: (id: string) => Promise<void>;
}) {
  const [expanded, setExpanded] = useState(false);
  const [editName, setEditName] = useState(label.name);
  const [editPrompt, setEditPrompt] = useState(label.prompt);
  const [editColor, setEditColor] = useState(label.color);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showMemory, setShowMemory] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const hasChanges =
    editName !== label.name ||
    editPrompt !== label.prompt ||
    editColor !== label.color;

  const handleSave = async () => {
    if (!hasChanges) return;
    setSaving(true);
    try {
      await onSave(label.id, { name: editName, prompt: editPrompt, color: editColor });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Delete "${label.name}"? All item associations will be removed.`)) return;
    setDeleting(true);
    try {
      await onDelete(label.id);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div
      className="border rounded-lg overflow-hidden"
      style={{ borderColor: "var(--border)" }}
    >
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-[var(--hover-bg)] transition-colors"
      >
        <span
          className="w-3 h-3 rounded-full flex-shrink-0"
          style={{ backgroundColor: label.color }}
        />
        <span className="font-medium flex-1 truncate">{label.name}</span>
        {label.auto_draft_enabled && (
          <span
            className="text-[10px] px-2 py-0.5 rounded-full"
            style={{ backgroundColor: "#3B82F622", color: "#3B82F6" }}
          >
            Auto-Draft
          </span>
        )}
        {label.folder_sync_status === "synced" && (
          <span
            className="text-[10px] px-2 py-0.5 rounded-full inline-flex items-center gap-1"
            style={{ backgroundColor: "#0EA5E922", color: "#0EA5E9" }}
          >
            <FolderIcon />
            Outlook
          </span>
        )}
        {label.folder_sync_status === "failed" && (
          <span
            className="text-[10px] px-2 py-0.5 rounded-full"
            style={{ backgroundColor: "#EF444422", color: "#EF4444" }}
          >
            Sync Failed
          </span>
        )}
        <span
          className="text-[10px] px-2 py-0.5 rounded-full"
          style={{
            backgroundColor: label.active ? "#10B98122" : "#6b728022",
            color: label.active ? "#10B981" : "#6b7280",
          }}
        >
          {label.active ? "Active" : "Paused"}
        </span>
        <ChevronDown open={expanded} />
      </button>

      {/* Expanded editor */}
      {expanded && (
        <div className="px-4 pb-4 pt-1 space-y-3 border-t" style={{ borderColor: "var(--border)" }}>
          {/* Name */}
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "var(--muted-foreground)" }}>
              Label Name
            </label>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              maxLength={100}
              className="w-full px-3 py-2 rounded-md border text-sm"
              style={{
                backgroundColor: "var(--input-bg)",
                borderColor: "var(--border)",
                color: "var(--foreground)",
              }}
            />
          </div>

          {/* Prompt */}
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "var(--muted-foreground)" }}>
              Matching Prompt
            </label>
            <textarea
              value={editPrompt}
              onChange={(e) => setEditPrompt(e.target.value)}
              rows={3}
              maxLength={5000}
              placeholder='e.g. "Messages from FISD that contain Landon"'
              className="w-full px-3 py-2 rounded-md border text-sm resize-y"
              style={{
                backgroundColor: "var(--input-bg)",
                borderColor: "var(--border)",
                color: "var(--foreground)",
              }}
            />
            <p className="text-[11px] mt-1" style={{ color: "var(--muted-foreground)" }}>
              Describe in plain English what items this label should match.
            </p>
          </div>

          {/* Color picker */}
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "var(--muted-foreground)" }}>
              Color
            </label>
            <div className="flex items-center gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setEditColor(c)}
                  className="w-6 h-6 rounded-full border-2 transition-transform"
                  style={{
                    backgroundColor: c,
                    borderColor: editColor === c ? "var(--foreground)" : "transparent",
                    transform: editColor === c ? "scale(1.2)" : "scale(1)",
                  }}
                />
              ))}
            </div>
          </div>

          {/* Auto-Draft Reply Toggle */}
          <div
            className="flex items-center gap-3 p-3 rounded-md border"
            style={{ borderColor: "var(--border)", backgroundColor: "var(--background)" }}
          >
            <div className="flex-1">
              <p className="text-xs font-medium" style={{ color: "var(--foreground)" }}>
                Auto-Draft Reply
              </p>
              <p className="text-[11px] mt-0.5" style={{ color: "var(--muted-foreground)" }}>
                Automatically generate AI reply drafts for emails classified under this label.
              </p>
            </div>
            <button
              onClick={() => onToggleDraft(label.id, !label.auto_draft_enabled)}
              className="relative w-10 h-5 rounded-full transition-colors flex-shrink-0"
              style={{
                backgroundColor: label.auto_draft_enabled ? "#3B82F6" : "#6b728044",
              }}
              role="switch"
              aria-checked={label.auto_draft_enabled}
            >
              <span
                className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform"
                style={{
                  left: label.auto_draft_enabled ? "22px" : "2px",
                }}
              />
            </button>
          </div>

          {/* Outlook Folder Sync */}
          <div
            className="flex items-center gap-3 p-3 rounded-md border"
            style={{ borderColor: "var(--border)", backgroundColor: "var(--background)" }}
          >
            <div className="flex-1">
              <p className="text-xs font-medium" style={{ color: "var(--foreground)" }}>
                Sync to Outlook Folder
              </p>
              <p className="text-[11px] mt-0.5" style={{ color: "var(--muted-foreground)" }}>
                {label.folder_sync_status === "synced"
                  ? "Matching emails are moved into a dedicated Outlook folder."
                  : label.folder_sync_status === "failed"
                  ? "Folder sync failed. Click retry to try again."
                  : label.folder_sync_status === "pending"
                  ? "Setting up Outlook folder..."
                  : "Create a matching Outlook mail folder and move classified emails into it."}
              </p>
            </div>
            {label.folder_sync_status === "synced" ? (
              <span
                className="text-[10px] px-2 py-1 rounded-md font-medium"
                style={{ backgroundColor: "#0EA5E922", color: "#0EA5E9" }}
              >
                Synced
              </span>
            ) : (
              <button
                onClick={async () => {
                  setSyncing(true);
                  try {
                    await onSyncFolder(label.id);
                  } finally {
                    setSyncing(false);
                  }
                }}
                disabled={syncing || label.folder_sync_status === "pending"}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors disabled:opacity-50"
                style={{
                  backgroundColor: label.folder_sync_status === "failed" ? "#EF444422" : "#0EA5E922",
                  color: label.folder_sync_status === "failed" ? "#EF4444" : "#0EA5E9",
                }}
              >
                <RefreshIcon />
                {syncing
                  ? "Syncing..."
                  : label.folder_sync_status === "failed"
                  ? "Retry"
                  : "Enable"}
              </button>
            )}
          </div>

          {/* Context Window Size */}
          {label.auto_draft_enabled && (
            <div className="flex items-center gap-3">
              <label className="text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>
                Memory window size
              </label>
              <select
                value={label.context_window_max}
                onChange={(e) => onUpdateContextMax(label.id, parseInt(e.target.value, 10))}
                className="px-2 py-1 rounded-md border text-xs"
                style={{
                  backgroundColor: "var(--input-bg)",
                  borderColor: "var(--border)",
                  color: "var(--foreground)",
                }}
              >
                {[3, 5, 7, 10].map((n) => (
                  <option key={n} value={n}>
                    {n} entries
                  </option>
                ))}
              </select>
              <p className="text-[11px]" style={{ color: "var(--muted-foreground)" }}>
                Recent emails used for tone calibration
              </p>
            </div>
          )}

          {/* Memory Viewer Toggle */}
          <div>
            <button
              onClick={() => setShowMemory(!showMemory)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border transition-colors hover:bg-[var(--hover-bg)]"
              style={{ borderColor: "var(--border)", color: "var(--foreground)" }}
            >
              <BrainIcon />
              {showMemory ? "Hide Memory" : "View Memory"}
              <span className="text-[10px]" style={{ color: "var(--muted-foreground)" }}>
                ({label.context_window_max} max)
              </span>
            </button>
            {showMemory && <MemoryViewer labelId={label.id} labelName={label.name} />}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={handleSave}
              disabled={!hasChanges || saving}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors disabled:opacity-50"
              style={{
                backgroundColor: hasChanges ? "#3B82F6" : "#3B82F644",
                color: "#fff",
              }}
            >
              <SaveIcon />
              {saving ? "Saving..." : "Save"}
            </button>
            <button
              onClick={() => onToggle(label.id, !label.active)}
              className="px-3 py-1.5 rounded-md text-xs font-medium border transition-colors"
              style={{
                borderColor: "var(--border)",
                color: "var(--foreground)",
              }}
            >
              {label.active ? "Pause" : "Activate"}
            </button>
            <div className="flex-1" />
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-red-500 hover:bg-red-500/10 transition-colors disabled:opacity-50"
            >
              <TrashIcon />
              {deleting ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Create Form ─────────────────────────────────────────

function CreateLabelForm({ onCreate }: { onCreate: (name: string, prompt: string, color: string) => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [prompt, setPrompt] = useState("");
  const [color, setColor] = useState("#6366F1");
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!name.trim() || !prompt.trim()) return;
    setCreating(true);
    try {
      await onCreate(name.trim(), prompt.trim(), color);
      setName("");
      setPrompt("");
      setColor("#6366F1");
      setOpen(false);
    } finally {
      setCreating(false);
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-dashed text-sm font-medium transition-colors hover:border-[#3B82F6] hover:text-[#3B82F6]"
        style={{ borderColor: "var(--border)", color: "var(--muted-foreground)" }}
      >
        <PlusIcon />
        Create Smart Label
      </button>
    );
  }

  return (
    <div className="border rounded-lg p-4 space-y-3" style={{ borderColor: "#3B82F6" }}>
      <div>
        <label className="block text-xs font-medium mb-1" style={{ color: "var(--muted-foreground)" }}>
          Label Name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={100}
          placeholder="e.g. School Updates"
          autoFocus
          className="w-full px-3 py-2 rounded-md border text-sm"
          style={{
            backgroundColor: "var(--input-bg)",
            borderColor: "var(--border)",
            color: "var(--foreground)",
          }}
        />
      </div>
      <div>
        <label className="block text-xs font-medium mb-1" style={{ color: "var(--muted-foreground)" }}>
          Matching Prompt
        </label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={3}
          maxLength={5000}
          placeholder='Describe what items this label should match, e.g. "Messages from FISD that contain Landon"'
          className="w-full px-3 py-2 rounded-md border text-sm resize-y"
          style={{
            backgroundColor: "var(--input-bg)",
            borderColor: "var(--border)",
            color: "var(--foreground)",
          }}
        />
      </div>
      <div>
        <label className="block text-xs font-medium mb-1" style={{ color: "var(--muted-foreground)" }}>
          Color
        </label>
        <div className="flex items-center gap-2">
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className="w-6 h-6 rounded-full border-2 transition-transform"
              style={{
                backgroundColor: c,
                borderColor: color === c ? "var(--foreground)" : "transparent",
                transform: color === c ? "scale(1.2)" : "scale(1)",
              }}
            />
          ))}
        </div>
      </div>
      <div className="flex items-center gap-2 pt-1">
        <button
          onClick={handleCreate}
          disabled={!name.trim() || !prompt.trim() || creating}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-colors disabled:opacity-50"
          style={{ backgroundColor: "#3B82F6", color: "#fff" }}
        >
          {creating ? "Creating..." : "Create Label"}
        </button>
        <button
          onClick={() => { setOpen(false); setName(""); setPrompt(""); }}
          className="px-4 py-2 rounded-md text-sm font-medium border transition-colors"
          style={{ borderColor: "var(--border)", color: "var(--foreground)" }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ── Main Component ──────────────────────────────────────

export function SmartLabelsClient({ userId }: { userId: string }) {
  const { toast } = useToast();
  const [labels, setLabels] = useState<SmartLabel[]>([]);
  const [loading, setLoading] = useState(true);
  const [classifying, setClassifying] = useState(false);
  const [classifyType, setClassifyType] = useState<string>("email");

  const fetchLabels = useCallback(async () => {
    try {
      const res = await fetch("/api/smart-labels");
      const data = await res.json();
      if (data.data) setLabels(data.data);
    } catch {
      toast({ title: "Failed to load smart labels", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchLabels();
  }, [fetchLabels]);

  const handleCreate = async (name: string, prompt: string, color: string) => {
    const res = await fetch("/api/smart-labels", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, prompt, color }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast({ title: data.error || "Failed to create label", variant: "destructive" });
      return;
    }
    setLabels((prev) => [...prev, data.data]);
    toast({
      title: `Created "${name}"`,
      description: "Outlook folder will be synced automatically if connected.",
      variant: "success",
    });
  };

  const handleSave = async (id: string, updates: { name?: string; prompt?: string; color?: string }) => {
    const res = await fetch(`/api/smart-labels/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    const data = await res.json();
    if (!res.ok) {
      toast({ title: data.error || "Failed to save", variant: "destructive" });
      return;
    }
    setLabels((prev) => prev.map((l) => (l.id === id ? data.data : l)));
    const currentLabel = labels.find((l) => l.id === id);
    const nameChanged = updates.name && currentLabel && currentLabel.name !== updates.name;
    toast({
      title: "Saved",
      description: nameChanged && currentLabel.graph_folder_id
        ? "Outlook folder will be renamed to match."
        : undefined,
      variant: "success",
    });
  };

  const handleDelete = async (id: string) => {
    const deletingLabel = labels.find((l) => l.id === id);
    const res = await fetch(`/api/smart-labels/${id}`, { method: "DELETE" });
    if (!res.ok) {
      toast({ title: "Failed to delete", variant: "destructive" });
      return;
    }
    setLabels((prev) => prev.filter((l) => l.id !== id));
    toast({
      title: "Deleted",
      description: deletingLabel?.graph_folder_id
        ? "Outlook folder was kept intact."
        : undefined,
      variant: "success",
    });
  };

  const handleToggle = async (id: string, active: boolean) => {
    const res = await fetch(`/api/smart-labels/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast({ title: data.error || "Failed to update", variant: "destructive" });
      return;
    }
    const toggledLabel = labels.find((l) => l.id === id);
    setLabels((prev) => prev.map((l) => (l.id === id ? data.data : l)));
    toast({
      title: active ? "Activated" : "Paused",
      description: !active && toggledLabel?.folder_sync_status === "synced"
        ? "New emails will no longer be moved to the Outlook folder."
        : undefined,
      variant: "success",
    });
  };

  const handleToggleDraft = async (id: string, enabled: boolean) => {
    const res = await fetch(`/api/smart-labels/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ autoDraftEnabled: enabled }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast({ title: data.error || "Failed to update", variant: "destructive" });
      return;
    }
    setLabels((prev) => prev.map((l) => (l.id === id ? data.data : l)));
    toast({ title: enabled ? "Auto-Draft enabled" : "Auto-Draft disabled", variant: "success" });
  };

  const handleUpdateContextMax = async (id: string, max: number) => {
    const res = await fetch(`/api/smart-labels/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contextWindowMax: max }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast({ title: data.error || "Failed to update", variant: "destructive" });
      return;
    }
    setLabels((prev) => prev.map((l) => (l.id === id ? data.data : l)));
    toast({ title: `Memory window set to ${max}`, variant: "success" });
  };

  const handleSyncFolder = async (id: string) => {
    const res = await fetch(`/api/smart-labels/${id}/sync-folder`, {
      method: "POST",
    });
    const data = await res.json();
    if (!res.ok) {
      toast({
        title: data.error || "Failed to sync Outlook folder",
        variant: "destructive",
      });
      // Refetch to get updated status
      fetchLabels();
      return;
    }
    toast({
      title: "Outlook folder synced",
      description: "Matching emails will now be moved to this folder.",
      variant: "success",
    });
    // Refetch labels to get the updated folder_sync_status
    fetchLabels();
  };

  const handleClassify = async () => {
    setClassifying(true);
    try {
      const res = await fetch("/api/smart-labels/classify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemType: classifyType, limit: 20 }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: data.error || "Classification failed", variant: "destructive" });
        return;
      }
      toast({
        title: `Classified ${data.classified} items (${data.skipped} skipped, ${data.errors} errors)`,
        variant: data.errors > 0 ? "destructive" : "success",
      });
    } catch {
      toast({ title: "Classification failed", variant: "destructive" });
    } finally {
      setClassifying(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="max-w-3xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-48 rounded bg-[var(--hover-bg)]" />
            <div className="h-20 rounded bg-[var(--hover-bg)]" />
            <div className="h-20 rounded bg-[var(--hover-bg)]" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>
            Smart Labels
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--muted-foreground)" }}>
            Define natural-language rules to automatically classify and tag items across your workspace.
          </p>
        </div>

        {/* Batch classify controls */}
        <div
          className="flex items-center gap-3 p-4 rounded-lg border"
          style={{ borderColor: "var(--border)", backgroundColor: "var(--card-bg)" }}
        >
          <SparklesIcon />
          <span className="text-sm font-medium flex-1" style={{ color: "var(--foreground)" }}>
            Run AI Classification
          </span>
          <select
            value={classifyType}
            onChange={(e) => setClassifyType(e.target.value)}
            className="px-2 py-1 rounded-md border text-xs"
            style={{
              backgroundColor: "var(--input-bg)",
              borderColor: "var(--border)",
              color: "var(--foreground)",
            }}
          >
            <option value="email">Outlook Emails</option>
            <option value="gmail_email">Gmail Emails</option>
            <option value="card">Cards</option>
            <option value="action_item">Action Items</option>
          </select>
          <button
            onClick={handleClassify}
            disabled={classifying || labels.filter((l) => l.active).length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors disabled:opacity-50"
            style={{ backgroundColor: "#8B5CF6", color: "#fff" }}
          >
            {classifying ? "Classifying..." : "Classify Now"}
          </button>
        </div>

        {/* Label list */}
        <div className="space-y-2">
          {labels.map((label) => (
            <LabelCard
              key={label.id}
              label={label}
              onSave={handleSave}
              onDelete={handleDelete}
              onToggle={handleToggle}
              onToggleDraft={handleToggleDraft}
              onUpdateContextMax={handleUpdateContextMax}
              onSyncFolder={handleSyncFolder}
            />
          ))}
          {labels.length === 0 && (
            <p className="text-sm text-center py-8" style={{ color: "var(--muted-foreground)" }}>
              No smart labels yet. Create one to start automatically classifying your items.
            </p>
          )}
        </div>

        {/* Create form */}
        <CreateLabelForm onCreate={handleCreate} />
      </div>
    </div>
  );
}
