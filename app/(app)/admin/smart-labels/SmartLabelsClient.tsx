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
  extract_knowledge: boolean;
  clip_to_page_id: string | null;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
}

interface WorkspacePage {
  id: string;
  title: string | null;
  icon: string | null;
  workspaceId: string;
}

interface Workspace {
  id: string;
  name: string;
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

// ── Label Row (list item) ────────────────────────────────

function LabelRow({ label, onClick }: { label: SmartLabel; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg border hover:bg-[var(--hover-bg)] transition-colors"
      style={{ borderColor: "var(--border)" }}
    >
      <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: label.color }} />
      <span className="font-medium flex-1 truncate text-sm" style={{ color: "var(--foreground)" }}>{label.name}</span>
      {label.is_pinned && (
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--muted-foreground)" }}>
          <path d="M12 17v5" />
          <path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16h14v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 2-2H6a2 2 0 0 0 2 2 1 1 0 0 1 1 1z" />
        </svg>
      )}
      {label.extract_knowledge && (
        <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ backgroundColor: "#10B98122", color: "#10B981" }}>Knowledge</span>
      )}
      {label.auto_draft_enabled && (
        <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ backgroundColor: "#3B82F622", color: "#3B82F6" }}>Auto-Draft</span>
      )}
      {label.folder_sync_status === "synced" && (
        <span className="text-[10px] px-2 py-0.5 rounded-full inline-flex items-center gap-1" style={{ backgroundColor: "#0EA5E922", color: "#0EA5E9" }}>
          <FolderIcon /> Folder
        </span>
      )}
      {label.folder_sync_status === "failed" && (
        <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ backgroundColor: "#EF444422", color: "#EF4444" }}>Sync Failed</span>
      )}
      <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ backgroundColor: label.active ? "#10B98122" : "#6b728022", color: label.active ? "#10B981" : "#6b7280" }}>
        {label.active ? "Active" : "Paused"}
      </span>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--muted-foreground)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
    </button>
  );
}

// ── Label Drawer ─────────────────────────────────────────

function LabelDrawer({
  label,
  open,
  onClose,
  onSave,
  onDelete,
  onToggle,
  onToggleDraft,
  onUpdateContextMax,
  onSyncFolder,
  onToggleExtractKnowledge,
  onSetClipToPage,
  onTogglePin,
  workspacePages,
  onCreatePage,
  existingNames,
}: {
  label: SmartLabel;
  open: boolean;
  onClose: () => void;
  onSave: (id: string, updates: { name?: string; prompt?: string; color?: string }) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onToggle: (id: string, active: boolean) => Promise<void>;
  onToggleDraft: (id: string, enabled: boolean) => Promise<void>;
  onUpdateContextMax: (id: string, max: number) => Promise<void>;
  onSyncFolder: (id: string) => Promise<void>;
  onToggleExtractKnowledge: (id: string, enabled: boolean) => Promise<void>;
  onSetClipToPage: (id: string, pageId: string | null) => Promise<void>;
  onTogglePin: (id: string, pinned: boolean) => Promise<void>;
  workspacePages: WorkspacePage[];
  onCreatePage: (title: string) => Promise<WorkspacePage | null>;
  existingNames: string[];
}) {
  const [editName, setEditName] = useState(label.name);
  const [editPrompt, setEditPrompt] = useState(label.prompt);
  const [editColor, setEditColor] = useState(label.color);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showMemory, setShowMemory] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [creatingPage, setCreatingPage] = useState(false);
  const [newPageName, setNewPageName] = useState("");
  const [enhancing, setEnhancing] = useState(false);

  // Reset local state when label changes
  useEffect(() => {
    setEditName(label.name);
    setEditPrompt(label.prompt);
    setEditColor(label.color);
    setShowMemory(false);
    setCreatingPage(false);
    setNewPageName("");
  }, [label.id, label.name, label.prompt, label.color]);

  const isDuplicateName = editName.trim().toLowerCase() !== label.name.toLowerCase() && existingNames.some((n) => n.toLowerCase() === editName.trim().toLowerCase());
  const hasChanges = editName !== label.name || editPrompt !== label.prompt || editColor !== label.color;

  const handleSave = async () => {
    if (!hasChanges || isDuplicateName) return;
    setSaving(true);
    try { await onSave(label.id, { name: editName, prompt: editPrompt, color: editColor }); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!confirm(`Delete "${label.name}"? All item associations will be removed.`)) return;
    setDeleting(true);
    try { await onDelete(label.id); onClose(); }
    finally { setDeleting(false); }
  };

  return (
    <>
      {/* Backdrop */}
      {open && <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />}
      {/* Drawer */}
      <div
        className="fixed top-0 right-0 h-full w-full max-w-md z-50 shadow-2xl transition-transform duration-300 ease-in-out overflow-y-auto"
        style={{
          backgroundColor: "var(--card)",
          borderLeft: "1px solid var(--border)",
          transform: open ? "translateX(0)" : "translateX(100%)",
        }}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center gap-3 px-5 py-4 border-b" style={{ borderColor: "var(--border)", backgroundColor: "var(--card)" }}>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-[var(--hover-bg)] transition-colors" title="Close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" x2="6" y1="6" y2="18" /><line x1="6" x2="18" y1="6" y2="18" /></svg>
          </button>
          <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: label.color }} />
          <h2 className="text-lg font-semibold flex-1 truncate" style={{ color: "var(--foreground)" }}>{label.name}</h2>
          <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ backgroundColor: label.active ? "#10B98122" : "#6b728022", color: label.active ? "#10B981" : "#6b7280" }}>
            {label.active ? "Active" : "Paused"}
          </span>
        </div>

        <div className="px-5 py-5 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "var(--muted-foreground)" }} title="A short name for this label. This appears in the inbox, tab bar, and folder name.">Label Name</label>
            <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} maxLength={100} className="w-full px-3 py-2 rounded-md border text-sm" style={{ backgroundColor: "var(--input-bg)", borderColor: isDuplicateName ? "#EF4444" : "var(--border)", color: "var(--foreground)" }} />
            {isDuplicateName && <p className="text-[11px] mt-1" style={{ color: "#EF4444" }}>A smart label with this name already exists.</p>}
          </div>

          {/* Prompt */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium" style={{ color: "var(--muted-foreground)" }} title="Write a natural-language description of what emails should match this label. AI uses this to classify incoming messages.">Matching Prompt</label>
              <button
                onClick={async () => {
                  if (!editPrompt.trim()) return;
                  setEnhancing(true);
                  try {
                    const res = await fetch("/api/smart-labels/enhance-prompt", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ prompt: editPrompt, labelName: editName }),
                    });
                    const data = await res.json();
                    if (res.ok && data.data?.prompt) setEditPrompt(data.data.prompt);
                  } finally { setEnhancing(false); }
                }}
                disabled={enhancing || !editPrompt.trim()}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium transition-colors disabled:opacity-40"
                style={{ color: "#8B5CF6" }}
                title="Use AI to make this prompt more specific and effective at matching the right emails"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" /></svg>
                {enhancing ? "Enhancing..." : "Enhance with AI"}
              </button>
            </div>
            <textarea value={editPrompt} onChange={(e) => setEditPrompt(e.target.value)} rows={3} maxLength={5000} placeholder='e.g. "Messages from FISD that contain Landon"' className="w-full px-3 py-2 rounded-md border text-sm resize-y" style={{ backgroundColor: "var(--input-bg)", borderColor: "var(--border)", color: "var(--foreground)" }} />
            <p className="text-[11px] mt-1" style={{ color: "var(--muted-foreground)" }}>Write in plain English. Be as specific or broad as you like — AI will use this to decide which emails match.</p>
          </div>

          {/* Color */}
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "var(--muted-foreground)" }} title="Choose a color for this label. It appears as a chip in the inbox and in the tab bar.">Color</label>
            <div className="flex items-center gap-2">
              {PRESET_COLORS.map((c) => (
                <button key={c} onClick={() => setEditColor(c)} className="w-6 h-6 rounded-full border-2 transition-transform" style={{ backgroundColor: c, borderColor: editColor === c ? "var(--foreground)" : "transparent", transform: editColor === c ? "scale(1.2)" : "scale(1)" }} />
              ))}
            </div>
          </div>

          {/* Save bar */}
          {hasChanges && (
            <div className="flex items-center gap-2">
              <button onClick={handleSave} disabled={saving || isDuplicateName} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-colors disabled:opacity-50" style={{ backgroundColor: "#3B82F6", color: "#fff" }}>
                <SaveIcon /> {saving ? "Saving..." : "Save Changes"}
              </button>
              <button onClick={() => { setEditName(label.name); setEditPrompt(label.prompt); setEditColor(label.color); }} className="px-3 py-2 rounded-md text-sm border transition-colors" style={{ borderColor: "var(--border)", color: "var(--muted-foreground)" }}>
                Discard
              </button>
            </div>
          )}

          <hr style={{ borderColor: "var(--border)" }} />

          <p className="text-[11px] font-medium uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>Automation</p>

          {/* Auto-Draft */}
          <div className="flex items-center gap-3 p-3 rounded-md border" style={{ borderColor: "var(--border)", backgroundColor: "var(--background)" }} title="When enabled, AI will generate a draft reply for each email that matches this label. Drafts appear in your inbox for review before sending.">
            <div className="flex-1">
              <p className="text-xs font-medium" style={{ color: "var(--foreground)" }}>Auto-Draft Reply</p>
              <p className="text-[11px] mt-0.5" style={{ color: "var(--muted-foreground)" }}>When a matching email arrives, AI generates a draft reply using your writing style. You review and send.</p>
            </div>
            <button onClick={() => onToggleDraft(label.id, !label.auto_draft_enabled)} className="relative w-10 h-5 rounded-full transition-colors flex-shrink-0" style={{ backgroundColor: label.auto_draft_enabled ? "#3B82F6" : "#6b728044" }} role="switch" aria-checked={label.auto_draft_enabled} title={label.auto_draft_enabled ? "Disable auto-draft" : "Enable auto-draft"}>
              <span className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform" style={{ left: label.auto_draft_enabled ? "22px" : "2px" }} />
            </button>
          </div>

          {label.auto_draft_enabled && (
            <div className="flex items-center gap-3 pl-3" title="How many recent email exchanges to use as context when generating drafts. More entries = better tone matching, but slower generation.">
              <label className="text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>Memory window</label>
              <select value={label.context_window_max} onChange={(e) => onUpdateContextMax(label.id, parseInt(e.target.value, 10))} className="px-2 py-1 rounded-md border text-xs" style={{ backgroundColor: "var(--input-bg)", borderColor: "var(--border)", color: "var(--foreground)" }}>
                {[3, 5, 7, 10].map((n) => <option key={n} value={n}>{n} entries</option>)}
              </select>
              <p className="text-[11px]" style={{ color: "var(--muted-foreground)" }}>past emails for tone</p>
            </div>
          )}

          {/* Outlook Folder Sync */}
          <div className="flex items-center gap-3 p-3 rounded-md border" style={{ borderColor: "var(--border)", backgroundColor: "var(--background)" }} title="Creates a folder in your mail provider and automatically moves matching emails into it. Great for keeping your inbox clean while still having easy access.">
            <div className="flex-1">
              <p className="text-xs font-medium" style={{ color: "var(--foreground)" }}>Sync to Mail Folder</p>
              <p className="text-[11px] mt-0.5" style={{ color: "var(--muted-foreground)" }}>
                {label.folder_sync_status === "synced" ? "Matching emails are automatically moved into a dedicated folder." : label.folder_sync_status === "failed" ? "Folder sync failed. Click retry to try again." : label.folder_sync_status === "pending" ? "Setting up folder..." : "Automatically move matching emails out of your inbox and into a dedicated folder."}
              </p>
            </div>
            {label.folder_sync_status === "synced" ? (
              <span className="text-[10px] px-2 py-1 rounded-md font-medium" style={{ backgroundColor: "#0EA5E922", color: "#0EA5E9" }}>Synced</span>
            ) : (
              <button onClick={async () => { setSyncing(true); try { await onSyncFolder(label.id); } finally { setSyncing(false); } }} disabled={syncing || label.folder_sync_status === "pending"} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors disabled:opacity-50" style={{ backgroundColor: label.folder_sync_status === "failed" ? "#EF444422" : "#0EA5E922", color: label.folder_sync_status === "failed" ? "#EF4444" : "#0EA5E9" }}>
                <RefreshIcon /> {syncing ? "Syncing..." : label.folder_sync_status === "failed" ? "Retry" : "Enable"}
              </button>
            )}
          </div>

          {/* Knowledge Extraction */}
          <div className="p-3 rounded-md border space-y-3" style={{ borderColor: "var(--border)", backgroundColor: "var(--background)" }} title="When enabled, AI scans matching emails for important facts, dates, decisions, and action items, then saves them to a workspace page you choose.">
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <p className="text-xs font-medium" style={{ color: "var(--foreground)" }}>Extract Knowledge</p>
                <p className="text-[11px] mt-0.5" style={{ color: "var(--muted-foreground)" }}>AI scans matching emails for key facts, dates, and action items, then clips them to a workspace page.</p>
              </div>
              <button onClick={() => onToggleExtractKnowledge(label.id, !label.extract_knowledge)} className="relative w-10 h-5 rounded-full transition-colors flex-shrink-0" style={{ backgroundColor: label.extract_knowledge ? "#10B981" : "#6b728044" }} role="switch" aria-checked={label.extract_knowledge} title={label.extract_knowledge ? "Disable knowledge extraction" : "Enable knowledge extraction"}>
                <span className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform" style={{ left: label.extract_knowledge ? "22px" : "2px" }} />
              </button>
            </div>
            {label.extract_knowledge && (
              <div className="space-y-2">
                <label className="block text-xs font-medium" style={{ color: "var(--muted-foreground)" }} title="Choose which workspace page to save extracted knowledge to. You can also create a new page.">Clip to Page</label>
                <select value={label.clip_to_page_id ?? ""} onChange={(e) => onSetClipToPage(label.id, e.target.value || null)} className="w-full px-3 py-2 rounded-md border text-sm" style={{ backgroundColor: "var(--input-bg)", borderColor: "var(--border)", color: "var(--foreground)" }}>
                  <option value="">Select a page...</option>
                  {workspacePages.map((p) => <option key={p.id} value={p.id}>{p.icon ? `${p.icon} ` : ""}{p.title || "Untitled"}</option>)}
                </select>
                {!creatingPage ? (
                  <button onClick={() => setCreatingPage(true)} className="inline-flex items-center gap-1 text-[11px] font-medium transition-colors hover:opacity-80" style={{ color: "var(--primary)" }}>
                    <PlusIcon /> Create new page
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <input type="text" value={newPageName} onChange={(e) => setNewPageName(e.target.value)} placeholder="Page name..." autoFocus className="flex-1 px-2 py-1 rounded-md border text-xs" style={{ backgroundColor: "var(--input-bg)", borderColor: "var(--border)", color: "var(--foreground)" }}
                      onKeyDown={async (e) => {
                        if (e.key === "Enter" && newPageName.trim()) { const page = await onCreatePage(newPageName.trim()); if (page) await onSetClipToPage(label.id, page.id); setNewPageName(""); setCreatingPage(false); }
                        if (e.key === "Escape") { setNewPageName(""); setCreatingPage(false); }
                      }}
                    />
                    <button onClick={async () => { if (!newPageName.trim()) return; const page = await onCreatePage(newPageName.trim()); if (page) await onSetClipToPage(label.id, page.id); setNewPageName(""); setCreatingPage(false); }} className="px-2 py-1 rounded-md text-[11px] font-medium" style={{ backgroundColor: "#10B98122", color: "#10B981" }}>Create</button>
                    <button onClick={() => { setNewPageName(""); setCreatingPage(false); }} className="text-[11px]" style={{ color: "var(--muted-foreground)" }}>Cancel</button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Memory Viewer */}
          <div>
            <button onClick={() => setShowMemory(!showMemory)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border transition-colors hover:bg-[var(--hover-bg)]" style={{ borderColor: "var(--border)", color: "var(--foreground)" }}>
              <BrainIcon /> {showMemory ? "Hide Memory" : "View Memory"}
              <span className="text-[10px]" style={{ color: "var(--muted-foreground)" }}>({label.context_window_max} max)</span>
            </button>
            {showMemory && <MemoryViewer labelId={label.id} labelName={label.name} />}
          </div>

          {/* Pin to inbox */}
          <div className="flex items-center gap-3 p-3 rounded-md border" style={{ borderColor: "var(--border)", backgroundColor: "var(--background)" }} title="When pinned, this label appears as a tab in the inbox for quick filtering.">
            <div className="flex-1">
              <p className="text-xs font-medium" style={{ color: "var(--foreground)" }}>Pin to Inbox</p>
              <p className="text-[11px] mt-0.5" style={{ color: "var(--muted-foreground)" }}>Show this label as a tab in the inbox sidebar for quick filtering.</p>
            </div>
            <button onClick={() => onTogglePin(label.id, !label.is_pinned)} className="relative w-10 h-5 rounded-full transition-colors flex-shrink-0" style={{ backgroundColor: label.is_pinned ? "#3B82F6" : "#6b728044" }} role="switch" aria-checked={label.is_pinned} title={label.is_pinned ? "Unpin from inbox" : "Pin to inbox"}>
              <span className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform" style={{ left: label.is_pinned ? "22px" : "2px" }} />
            </button>
          </div>

          <hr style={{ borderColor: "var(--border)" }} />

          {/* Footer actions */}
          <div className="flex items-center gap-2">
            <button onClick={() => onToggle(label.id, !label.active)} className="px-3 py-1.5 rounded-md text-xs font-medium border transition-colors" style={{ borderColor: "var(--border)", color: "var(--foreground)" }}>
              {label.active ? "Pause" : "Activate"}
            </button>
            <div className="flex-1" />
            <button onClick={handleDelete} disabled={deleting} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-red-500 hover:bg-red-500/10 transition-colors disabled:opacity-50">
              <TrashIcon /> {deleting ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Create Label Drawer ──────────────────────────────────

function CreateLabelDrawer({ open, onClose, onCreate, existingNames }: {
  open: boolean;
  onClose: () => void;
  onCreate: (name: string, prompt: string, color: string) => Promise<void>;
  existingNames: string[];
}) {
  const [name, setName] = useState("");
  const [prompt, setPrompt] = useState("");
  const [color, setColor] = useState("#6366F1");
  const [creating, setCreating] = useState(false);
  const [enhancing, setEnhancing] = useState(false);

  const isDuplicateName = existingNames.some((n) => n.toLowerCase() === name.trim().toLowerCase());

  const handleCreate = async () => {
    if (!name.trim() || !prompt.trim() || isDuplicateName) return;
    setCreating(true);
    try {
      await onCreate(name.trim(), prompt.trim(), color);
      setName(""); setPrompt(""); setColor("#6366F1");
      onClose();
    } finally {
      setCreating(false);
    }
  };

  return (
    <>
      {open && <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />}
      <div
        className="fixed top-0 right-0 h-full w-full max-w-md z-50 shadow-2xl transition-transform duration-300 ease-in-out overflow-y-auto"
        style={{ backgroundColor: "var(--card)", borderLeft: "1px solid var(--border)", transform: open ? "translateX(0)" : "translateX(100%)" }}
      >
        <div className="sticky top-0 z-10 flex items-center gap-3 px-5 py-4 border-b" style={{ borderColor: "var(--border)", backgroundColor: "var(--card)" }}>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-[var(--hover-bg)] transition-colors" title="Close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" x2="6" y1="6" y2="18" /><line x1="6" x2="18" y1="6" y2="18" /></svg>
          </button>
          <h2 className="text-lg font-semibold flex-1" style={{ color: "var(--foreground)" }}>New Smart Label</h2>
        </div>
        <div className="px-5 py-5 space-y-4">
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "var(--muted-foreground)" }}>Label Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} maxLength={100} placeholder="e.g. School Updates" autoFocus className="w-full px-3 py-2 rounded-md border text-sm" style={{ backgroundColor: "var(--input-bg)", borderColor: isDuplicateName ? "#EF4444" : "var(--border)", color: "var(--foreground)" }} />
            {isDuplicateName && <p className="text-[11px] mt-1" style={{ color: "#EF4444" }}>A smart label with this name already exists.</p>}
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>Matching Prompt</label>
              <button
                onClick={async () => {
                  if (!prompt.trim()) return;
                  setEnhancing(true);
                  try {
                    const res = await fetch("/api/smart-labels/enhance-prompt", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ prompt, labelName: name }),
                    });
                    const data = await res.json();
                    if (res.ok && data.data?.prompt) setPrompt(data.data.prompt);
                  } finally { setEnhancing(false); }
                }}
                disabled={enhancing || !prompt.trim()}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium transition-colors disabled:opacity-40"
                style={{ color: "#8B5CF6" }}
                title="Use AI to make this prompt more specific and effective"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" /></svg>
                {enhancing ? "Enhancing..." : "Enhance with AI"}
              </button>
            </div>
            <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={3} maxLength={5000} placeholder='Describe what items this label should match, e.g. "Messages from FISD that contain Landon"' className="w-full px-3 py-2 rounded-md border text-sm resize-y" style={{ backgroundColor: "var(--input-bg)", borderColor: "var(--border)", color: "var(--foreground)" }} />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "var(--muted-foreground)" }}>Color</label>
            <div className="flex items-center gap-2">
              {PRESET_COLORS.map((c) => (
                <button key={c} onClick={() => setColor(c)} className="w-6 h-6 rounded-full border-2 transition-transform" style={{ backgroundColor: c, borderColor: color === c ? "var(--foreground)" : "transparent", transform: color === c ? "scale(1.2)" : "scale(1)" }} />
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2 pt-2">
            <button onClick={handleCreate} disabled={!name.trim() || !prompt.trim() || creating || isDuplicateName} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-colors disabled:opacity-50" style={{ backgroundColor: "#3B82F6", color: "#fff" }}>
              {creating ? "Creating..." : "Create Label"}
            </button>
            <button onClick={onClose} className="px-4 py-2 rounded-md text-sm font-medium border transition-colors" style={{ borderColor: "var(--border)", color: "var(--foreground)" }}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Main Component ──────────────────────────────────────

export function SmartLabelsClient({ userId }: { userId: string }) {
  const { toast } = useToast();
  const [labels, setLabels] = useState<SmartLabel[]>([]);
  const [loading, setLoading] = useState(true);
  const [workspacePages, setWorkspacePages] = useState<WorkspacePage[]>([]);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [editingLabelId, setEditingLabelId] = useState<string | null>(null);
  const [showCreateDrawer, setShowCreateDrawer] = useState(false);

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

  const fetchWorkspacePages = useCallback(async () => {
    try {
      const wsRes = await fetch("/api/pages/workspaces");
      const wsList: Workspace[] = await wsRes.json();
      setWorkspaces(wsList);
      const allPages: WorkspacePage[] = [];
      for (const ws of wsList) {
        const pRes = await fetch(`/api/pages?workspace_id=${ws.id}`);
        const pages = await pRes.json();
        if (Array.isArray(pages)) {
          allPages.push(...pages.map((p: { id: string; title: string | null; icon: string | null }) => ({
            id: p.id,
            title: p.title,
            icon: p.icon,
            workspaceId: ws.id,
          })));
        }
      }
      setWorkspacePages(allPages);
    } catch {
      // Non-critical — dropdown will be empty
    }
  }, []);

  useEffect(() => {
    fetchLabels();
    fetchWorkspacePages();
  }, [fetchLabels, fetchWorkspacePages]);

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

  const handleToggleExtractKnowledge = async (id: string, enabled: boolean) => {
    const res = await fetch(`/api/smart-labels/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ extractKnowledge: enabled }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast({ title: data.error || "Failed to update", variant: "destructive" });
      return;
    }
    setLabels((prev) => prev.map((l) => (l.id === id ? data.data : l)));
    toast({ title: enabled ? "Knowledge extraction enabled" : "Knowledge extraction disabled", variant: "success" });
  };

  const handleSetClipToPage = async (id: string, pageId: string | null) => {
    const res = await fetch(`/api/smart-labels/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clipToPageId: pageId }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast({ title: data.error || "Failed to update", variant: "destructive" });
      return;
    }
    setLabels((prev) => prev.map((l) => (l.id === id ? data.data : l)));
    if (pageId) {
      const page = workspacePages.find((p) => p.id === pageId);
      toast({ title: `Clipping to "${page?.title || "page"}"`, variant: "success" });
    } else {
      toast({ title: "Page unlinked", variant: "success" });
    }
  };

  const handleTogglePin = async (id: string, pinned: boolean) => {
    const res = await fetch(`/api/smart-labels/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPinned: pinned }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast({ title: data.error || "Failed to update", variant: "destructive" });
      return;
    }
    setLabels((prev) => prev.map((l) => (l.id === id ? data.data : l)));
    toast({ title: pinned ? "Pinned to inbox" : "Unpinned from inbox", variant: "success" });
  };

  const handleCreatePage = async (title: string): Promise<WorkspacePage | null> => {
    // Use the first workspace, or create one if none exist
    let wsId = workspaces[0]?.id;
    if (!wsId) {
      try {
        const res = await fetch("/api/pages/workspaces", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: "My Workspace" }),
        });
        const ws = await res.json();
        wsId = ws.id;
        setWorkspaces((prev) => [...prev, ws]);
      } catch {
        toast({ title: "Failed to create workspace", variant: "destructive" });
        return null;
      }
    }
    try {
      const res = await fetch("/api/pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspace_id: wsId, title }),
      });
      const page = await res.json();
      const wp: WorkspacePage = { id: page.id, title: page.title, icon: page.icon, workspaceId: wsId };
      setWorkspacePages((prev) => [...prev, wp]);
      toast({ title: `Created page "${title}"`, variant: "success" });
      return wp;
    } catch {
      toast({ title: "Failed to create page", variant: "destructive" });
      return null;
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

        {/* Helper text */}
        <div
          className="rounded-lg border p-4 space-y-3 text-sm"
          style={{ borderColor: "var(--border)", backgroundColor: "var(--card-bg)" }}
        >
          <p style={{ color: "var(--muted-foreground)" }}>
            Smart labels use AI to automatically classify your messages based on natural-language rules you write in plain English. Click any label to configure it, or create a new one below.
          </p>
          <p className="text-xs font-medium" style={{ color: "var(--foreground)" }}>Each label can optionally:</p>
          <ul className="space-y-1.5 text-[13px]" style={{ color: "var(--muted-foreground)" }}>
            <li className="flex items-start gap-2.5">
              <span className="flex-shrink-0 mt-0.5"><FolderIcon /></span>
              <span><span className="font-medium" style={{ color: "var(--foreground)" }}>Sync to mail folder</span> — automatically move matching emails into a dedicated Outlook or Gmail folder so they stay organized.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="flex-shrink-0 mt-0.5"><BrainIcon /></span>
              <span><span className="font-medium" style={{ color: "var(--foreground)" }}>Extract knowledge</span> — detect key information in matching emails and clip it to a workspace page for later reference.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="flex-shrink-0 mt-0.5"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /><path d="m15 5 4 4" /></svg></span>
              <span><span className="font-medium" style={{ color: "var(--foreground)" }}>Auto-draft replies</span> — generate AI reply drafts calibrated to your writing style using a memory of past conversations.</span>
            </li>
          </ul>
          <p className="text-[11px]" style={{ color: "var(--muted-foreground)" }}>
            A message can have multiple labels applied to it, but it can only be moved into one folder. When multiple labels match, the first matching label with folder sync enabled determines which folder the message is moved to.
          </p>
          <p className="text-[11px]" style={{ color: "var(--muted-foreground)" }}>
            Tip: Pin labels to the inbox tab bar for quick filtering, then press 1-9 to quickly move messages between labels.
          </p>
        </div>

        {/* Label list */}
        <div className="space-y-2">
          {[...labels].sort((a, b) => a.name.localeCompare(b.name)).map((label) => (
            <LabelRow key={label.id} label={label} onClick={() => setEditingLabelId(label.id)} />
          ))}
          {labels.length === 0 && (
            <p className="text-sm text-center py-8" style={{ color: "var(--muted-foreground)" }}>
              No smart labels yet. Create one to get started.
            </p>
          )}
        </div>

        {/* Create button */}
        <button
          onClick={() => setShowCreateDrawer(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-dashed text-sm font-medium transition-colors hover:border-[#3B82F6] hover:text-[#3B82F6]"
          style={{ borderColor: "var(--border)", color: "var(--muted-foreground)" }}
        >
          <PlusIcon />
          Create Smart Label
        </button>
      </div>

      {/* Create drawer */}
      <CreateLabelDrawer
        open={showCreateDrawer}
        onClose={() => setShowCreateDrawer(false)}
        onCreate={handleCreate}
        existingNames={labels.map((l) => l.name)}
      />

      {/* Edit drawer */}
      {editingLabelId && (() => {
        const label = labels.find((l) => l.id === editingLabelId);
        if (!label) return null;
        return (
          <LabelDrawer
            label={label}
            open={true}
            onClose={() => setEditingLabelId(null)}
            onSave={handleSave}
            onDelete={async (id) => { await handleDelete(id); setEditingLabelId(null); }}
            onToggle={handleToggle}
            onToggleDraft={handleToggleDraft}
            onUpdateContextMax={handleUpdateContextMax}
            onSyncFolder={handleSyncFolder}
            onToggleExtractKnowledge={handleToggleExtractKnowledge}
            onSetClipToPage={handleSetClipToPage}
            onTogglePin={handleTogglePin}
            workspacePages={workspacePages}
            onCreatePage={handleCreatePage}
            existingNames={labels.map((l) => l.name)}
          />
        );
      })()}
    </div>
  );
}
