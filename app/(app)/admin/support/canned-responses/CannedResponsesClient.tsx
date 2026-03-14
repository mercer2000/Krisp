"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Pencil, Trash2, X } from "lucide-react";

// ── Types ────────────────────────────────────────────────

interface CannedResponse {
  id: string;
  title: string;
  content: string;
  category: string | null;
  shortcut: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

interface FormValues {
  title: string;
  content: string;
  category: string;
  shortcut: string;
}

const EMPTY_FORM: FormValues = {
  title: "",
  content: "",
  category: "",
  shortcut: "",
};

// ── Component ────────────────────────────────────────────

export default function CannedResponsesClient() {
  const [responses, setResponses] = useState<CannedResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<CannedResponse | null>(null);
  const [form, setForm] = useState<FormValues>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  // ── Fetch responses ──────────────────────────────────────

  const fetchResponses = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/support/canned-responses");
      if (res.ok) {
        const data = await res.json();
        setResponses(data.responses ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchResponses();
  }, [fetchResponses]);

  // ── Open modal ───────────────────────────────────────────

  const openAdd = useCallback(() => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  }, []);

  const openEdit = useCallback((r: CannedResponse) => {
    setEditing(r);
    setForm({
      title: r.title,
      content: r.content,
      category: r.category ?? "",
      shortcut: r.shortcut ?? "",
    });
    setModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setModalOpen(false);
    setEditing(null);
    setForm(EMPTY_FORM);
  }, []);

  // ── Save (create or update) ──────────────────────────────

  const handleSave = useCallback(async () => {
    if (!form.title.trim() || !form.content.trim()) return;
    setSubmitting(true);

    const body: Record<string, string> = {
      title: form.title.trim(),
      content: form.content.trim(),
    };
    if (form.category.trim()) body.category = form.category.trim();
    if (form.shortcut.trim()) body.shortcut = form.shortcut.trim();

    try {
      if (editing) {
        const res = await fetch(
          `/api/admin/support/canned-responses/${editing.id}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          }
        );
        if (!res.ok) throw new Error("Failed to update response");
      } else {
        const res = await fetch("/api/admin/support/canned-responses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error("Failed to create response");
      }
      closeModal();
      await fetchResponses();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  }, [form, editing, closeModal, fetchResponses]);

  // ── Delete ───────────────────────────────────────────────

  const handleDelete = useCallback(
    async (id: string) => {
      if (!window.confirm("Delete this canned response?")) return;

      try {
        const res = await fetch(
          `/api/admin/support/canned-responses/${id}`,
          { method: "DELETE" }
        );
        if (!res.ok) throw new Error("Failed to delete response");
        await fetchResponses();
      } catch (err) {
        console.error(err);
      }
    },
    [fetchResponses]
  );

  // ── Render ───────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2
          className="text-xl font-semibold"
          style={{ color: "var(--foreground)" }}
        >
          Canned Responses
        </h2>
        <button
          onClick={openAdd}
          className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white"
          style={{ backgroundColor: "var(--accent)" }}
        >
          <Plus className="h-4 w-4" />
          Add Response
        </button>
      </div>

      {/* Table */}
      <div
        className="overflow-hidden rounded-lg border"
        style={{
          borderColor: "var(--border)",
          backgroundColor: "var(--card)",
        }}
      >
        {loading ? (
          <div
            className="flex items-center justify-center py-12 text-sm"
            style={{ color: "var(--muted-foreground)" }}
          >
            Loading...
          </div>
        ) : responses.length === 0 ? (
          <div
            className="flex items-center justify-center py-12 text-sm"
            style={{ color: "var(--muted-foreground)" }}
          >
            No canned responses yet. Click &quot;Add Response&quot; to create
            one.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr
                className="border-b text-left"
                style={{
                  borderColor: "var(--border)",
                  color: "var(--muted-foreground)",
                }}
              >
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Shortcut</th>
                <th className="px-4 py-3 font-medium">Content</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {responses.map((r) => (
                <tr
                  key={r.id}
                  className="border-b last:border-b-0"
                  style={{ borderColor: "var(--border)" }}
                >
                  <td
                    className="px-4 py-3 font-medium"
                    style={{ color: "var(--foreground)" }}
                  >
                    {r.title}
                  </td>
                  <td
                    className="px-4 py-3"
                    style={{ color: "var(--muted-foreground)" }}
                  >
                    {r.category ?? "\u2014"}
                  </td>
                  <td className="px-4 py-3">
                    {r.shortcut ? (
                      <code
                        className="rounded px-1.5 py-0.5 text-xs"
                        style={{
                          backgroundColor: "var(--accent)",
                          color: "var(--foreground)",
                        }}
                      >
                        {r.shortcut}
                      </code>
                    ) : (
                      <span style={{ color: "var(--muted-foreground)" }}>
                        &mdash;
                      </span>
                    )}
                  </td>
                  <td
                    className="max-w-xs truncate px-4 py-3"
                    style={{ color: "var(--muted-foreground)" }}
                  >
                    {r.content.length > 80
                      ? r.content.slice(0, 80) + "..."
                      : r.content}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex items-center gap-1">
                      <button
                        onClick={() => openEdit(r)}
                        className="rounded p-1.5 transition-colors hover:opacity-80"
                        style={{ color: "var(--muted-foreground)" }}
                        title="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(r.id)}
                        className="rounded p-1.5 transition-colors hover:opacity-80 text-red-500"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={closeModal}
          />

          {/* Panel */}
          <div
            className="relative z-10 w-full max-w-lg rounded-xl border p-6 shadow-xl"
            style={{
              backgroundColor: "var(--card)",
              borderColor: "var(--border)",
            }}
          >
            {/* Modal header */}
            <div className="mb-5 flex items-center justify-between">
              <h3
                className="text-lg font-semibold"
                style={{ color: "var(--foreground)" }}
              >
                {editing ? "Edit Response" : "Add Response"}
              </h3>
              <button
                onClick={closeModal}
                className="rounded p-1 transition-colors hover:opacity-80"
                style={{ color: "var(--muted-foreground)" }}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form */}
            <div className="space-y-4">
              {/* Title */}
              <div>
                <label
                  className="mb-1 block text-sm font-medium"
                  style={{ color: "var(--foreground)" }}
                >
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, title: e.target.value }))
                  }
                  placeholder="e.g. Greeting"
                  className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/40"
                  style={{
                    borderColor: "var(--border)",
                    backgroundColor: "var(--background)",
                    color: "var(--foreground)",
                  }}
                />
              </div>

              {/* Content */}
              <div>
                <label
                  className="mb-1 block text-sm font-medium"
                  style={{ color: "var(--foreground)" }}
                >
                  Content <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={form.content}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, content: e.target.value }))
                  }
                  rows={5}
                  placeholder="Type the canned response content..."
                  className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/40"
                  style={{
                    borderColor: "var(--border)",
                    backgroundColor: "var(--background)",
                    color: "var(--foreground)",
                  }}
                />
              </div>

              {/* Category & Shortcut row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    className="mb-1 block text-sm font-medium"
                    style={{ color: "var(--foreground)" }}
                  >
                    Category
                  </label>
                  <input
                    type="text"
                    value={form.category}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, category: e.target.value }))
                    }
                    placeholder="e.g. General"
                    className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/40"
                    style={{
                      borderColor: "var(--border)",
                      backgroundColor: "var(--background)",
                      color: "var(--foreground)",
                    }}
                  />
                </div>
                <div>
                  <label
                    className="mb-1 block text-sm font-medium"
                    style={{ color: "var(--foreground)" }}
                  >
                    Shortcut
                  </label>
                  <input
                    type="text"
                    value={form.shortcut}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, shortcut: e.target.value }))
                    }
                    placeholder="e.g. /greeting"
                    className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/40"
                    style={{
                      borderColor: "var(--border)",
                      backgroundColor: "var(--background)",
                      color: "var(--foreground)",
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Modal footer */}
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={closeModal}
                className="rounded-lg border px-4 py-2 text-sm font-medium transition-colors hover:opacity-80"
                style={{
                  borderColor: "var(--border)",
                  color: "var(--foreground)",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={
                  submitting || !form.title.trim() || !form.content.trim()
                }
                className="rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: "var(--accent)" }}
              >
                {submitting
                  ? "Saving..."
                  : editing
                    ? "Update"
                    : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
