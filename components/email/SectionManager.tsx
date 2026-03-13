"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import type { InboxSection, InboxSectionFilterCriteria } from "@/types/inboxSection";

interface EmailAccount {
  id: string;
  email: string;
  provider: "outlook" | "gmail" | "zoom";
}

interface LabelDef {
  id: string;
  name: string;
  color: string;
}

interface SectionManagerProps {
  open: boolean;
  onClose: () => void;
  sections: InboxSection[];
  onSectionsChange: (sections: InboxSection[]) => void;
  accounts: EmailAccount[];
  allLabels: LabelDef[];
  allSmartLabels: LabelDef[];
}

const PRESET_COLORS = [
  "#6366F1", "#EC4899", "#F59E0B", "#10B981", "#3B82F6",
  "#EF4444", "#8B5CF6", "#06B6D4", "#F97316", "#14B8A6",
];

export function SectionManager({
  open,
  onClose,
  sections,
  onSectionsChange,
  accounts,
  allLabels,
  allSmartLabels,
}: SectionManagerProps) {
  const [editingSection, setEditingSection] = useState<InboxSection | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [color, setColor] = useState("#6366F1");
  const [provider, setProvider] = useState<string>("");
  const [accountId, setAccountId] = useState<string>("");
  const [labelId, setLabelId] = useState<string>("");
  const [smartLabelId, setSmartLabelId] = useState<string>("");
  const [senderDomain, setSenderDomain] = useState("");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [folder, setFolder] = useState<string>("");
  const [saving, setSaving] = useState(false);

  const resetForm = () => {
    setName("");
    setColor("#6366F1");
    setProvider("");
    setAccountId("");
    setLabelId("");
    setSmartLabelId("");
    setSenderDomain("");
    setUnreadOnly(false);
    setFolder("");
    setEditingSection(null);
    setIsCreating(false);
  };

  const openCreate = () => {
    resetForm();
    setIsCreating(true);
  };

  const openEdit = (section: InboxSection) => {
    const c = section.filterCriteria;
    setName(section.name);
    setColor(section.color);
    setProvider(c.provider || "");
    setAccountId(c.accountId || "");
    setLabelId(c.labelId || "");
    setSmartLabelId(c.smartLabelId || "");
    setSenderDomain(c.senderDomain || "");
    setUnreadOnly(c.unreadOnly || false);
    setFolder(c.folder || "");
    setEditingSection(section);
    setIsCreating(true);
  };

  const buildCriteria = (): InboxSectionFilterCriteria => {
    const criteria: InboxSectionFilterCriteria = {};
    if (provider) criteria.provider = provider as "outlook" | "gmail" | "zoom";
    if (accountId) criteria.accountId = accountId;
    if (labelId) criteria.labelId = labelId;
    if (smartLabelId) criteria.smartLabelId = smartLabelId;
    if (senderDomain.trim()) criteria.senderDomain = senderDomain.trim();
    if (unreadOnly) criteria.unreadOnly = true;
    if (folder) criteria.folder = folder as "inbox" | "spam" | "done" | "all";
    return criteria;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);

    try {
      const criteria = buildCriteria();

      if (editingSection) {
        const res = await fetch(`/api/inbox-sections/${editingSection.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: name.trim(), color, filterCriteria: criteria }),
        });
        if (!res.ok) throw new Error("Failed to update");
        const { data } = await res.json();
        onSectionsChange(sections.map((s) => (s.id === data.id ? data : s)));
      } else {
        const res = await fetch("/api/inbox-sections", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name.trim(),
            color,
            filterCriteria: criteria,
            position: sections.length,
          }),
        });
        if (!res.ok) throw new Error("Failed to create");
        const { data } = await res.json();
        onSectionsChange([...sections, data]);
      }
      resetForm();
    } catch {
      // Error handled silently
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/inbox-sections/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      onSectionsChange(sections.filter((s) => s.id !== id));
    } catch {
      // Error handled silently
    }
  };

  return (
    <Modal open={open} onClose={() => { resetForm(); onClose(); }} title="Inbox Sections">
      <div className="space-y-4">
        {!isCreating ? (
          <>
            {sections.length === 0 ? (
              <p className="text-sm text-[var(--muted-foreground)] text-center py-4">
                No sections yet. Create sections to filter your split inbox view.
              </p>
            ) : (
              <div className="space-y-2">
                {sections.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-[var(--border)] hover:bg-[var(--accent)]/50 transition-colors"
                  >
                    <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[var(--foreground)] truncate">{s.name}</p>
                      <p className="text-[10px] text-[var(--muted-foreground)] truncate">
                        {describeCriteria(s.filterCriteria)}
                      </p>
                    </div>
                    <button
                      onClick={() => openEdit(s)}
                      className="p-1 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
                      title="Edit"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(s.id)}
                      className="p-1 text-[var(--muted-foreground)] hover:text-[var(--destructive)] transition-colors"
                      title="Delete"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={openCreate}
              className="w-full px-4 py-2.5 text-sm font-medium rounded-lg border border-dashed border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:border-[var(--primary)] hover:bg-[var(--primary)]/5 transition-colors"
            >
              + Create Section
            </button>
          </>
        ) : (
          <form onSubmit={handleSave} className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <button
                type="button"
                onClick={resetForm}
                className="p-1 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m15 18-6-6 6-6" />
                </svg>
              </button>
              <h3 className="text-sm font-medium text-[var(--foreground)]">
                {editingSection ? "Edit Section" : "New Section"}
              </h3>
            </div>

            {/* Name */}
            <div>
              <label className="block text-xs text-[var(--muted-foreground)] mb-1">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Team, Newsletters, VIP"
                className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                required
              />
            </div>

            {/* Color */}
            <div>
              <label className="block text-xs text-[var(--muted-foreground)] mb-1">Color</label>
              <div className="flex items-center gap-1.5">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`w-6 h-6 rounded-full transition-transform ${color === c ? "ring-2 ring-offset-2 ring-[var(--ring)] scale-110" : "hover:scale-110"}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            {/* Filter criteria */}
            <div className="space-y-3 pt-2 border-t border-[var(--border)]">
              <h4 className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                Filter Criteria
              </h4>

              {/* Provider */}
              <div>
                <label className="block text-xs text-[var(--muted-foreground)] mb-1">Provider</label>
                <select
                  value={provider}
                  onChange={(e) => setProvider(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)]"
                >
                  <option value="">Any</option>
                  <option value="outlook">Outlook</option>
                  <option value="gmail">Gmail</option>
                  <option value="zoom">Zoom</option>
                </select>
              </div>

              {/* Account */}
              {accounts.length > 1 && (
                <div>
                  <label className="block text-xs text-[var(--muted-foreground)] mb-1">Account</label>
                  <select
                    value={accountId}
                    onChange={(e) => setAccountId(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)]"
                  >
                    <option value="">Any</option>
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>{a.email}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Sender domain */}
              <div>
                <label className="block text-xs text-[var(--muted-foreground)] mb-1">Sender Domain</label>
                <input
                  type="text"
                  value={senderDomain}
                  onChange={(e) => setSenderDomain(e.target.value)}
                  placeholder="e.g., company.com"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                />
              </div>

              {/* Label */}
              {allLabels.length > 0 && (
                <div>
                  <label className="block text-xs text-[var(--muted-foreground)] mb-1">Label</label>
                  <select
                    value={labelId}
                    onChange={(e) => setLabelId(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)]"
                  >
                    <option value="">Any</option>
                    {allLabels.map((l) => (
                      <option key={l.id} value={l.id}>{l.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Smart label */}
              {allSmartLabels.length > 0 && (
                <div>
                  <label className="block text-xs text-[var(--muted-foreground)] mb-1">Smart Label</label>
                  <select
                    value={smartLabelId}
                    onChange={(e) => setSmartLabelId(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)]"
                  >
                    <option value="">Any</option>
                    {allSmartLabels.map((l) => (
                      <option key={l.id} value={l.id}>{l.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Folder */}
              <div>
                <label className="block text-xs text-[var(--muted-foreground)] mb-1">Folder</label>
                <select
                  value={folder}
                  onChange={(e) => setFolder(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)]"
                >
                  <option value="">Inbox (default)</option>
                  <option value="inbox">Inbox</option>
                  <option value="done">Done</option>
                  <option value="spam">Spam</option>
                  <option value="all">All</option>
                </select>
              </div>

              {/* Unread only */}
              <label className="flex items-center gap-2 text-sm text-[var(--foreground)] cursor-pointer">
                <input
                  type="checkbox"
                  checked={unreadOnly}
                  onChange={(e) => setUnreadOnly(e.target.checked)}
                  className="rounded border-[var(--border)] accent-[var(--primary)]"
                />
                Unread only
              </label>
            </div>

            {/* Save button */}
            <button
              type="submit"
              disabled={saving || !name.trim()}
              className="w-full px-4 py-2.5 text-sm font-medium rounded-lg bg-[var(--primary)] text-white hover:opacity-90 transition-opacity disabled:opacity-40"
            >
              {saving ? "Saving..." : editingSection ? "Update Section" : "Create Section"}
            </button>
          </form>
        )}
      </div>
    </Modal>
  );
}

function describeCriteria(criteria: InboxSectionFilterCriteria): string {
  const parts: string[] = [];
  if (criteria.provider) parts.push(criteria.provider);
  if (criteria.senderDomain) parts.push(`@${criteria.senderDomain}`);
  if (criteria.unreadOnly) parts.push("unread only");
  if (criteria.folder) parts.push(criteria.folder);
  if (criteria.labelId) parts.push("label filter");
  if (criteria.smartLabelId) parts.push("smart label filter");
  if (criteria.accountId) parts.push("specific account");
  return parts.length > 0 ? parts.join(" + ") : "all mail";
}
