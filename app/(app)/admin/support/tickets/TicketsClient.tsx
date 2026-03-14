"use client";

import { useState, useEffect, useCallback } from "react";
import { ArrowLeft, ChevronLeft, ChevronRight, X } from "lucide-react";

// ── Types ────────────────────────────────────────────────

type TicketStatus = "open" | "in_progress" | "resolved" | "closed";
type TicketPriority = "low" | "medium" | "high";

interface TicketSummary {
  id: string;
  subject: string;
  status: TicketStatus;
  priority: TicketPriority;
  assignedAgentId: string | null;
  createdAt: string;
}

interface TicketMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

interface TicketDetail {
  id: string;
  subject: string;
  status: TicketStatus;
  priority: TicketPriority;
  assignedAgentId: string | null;
  createdAt: string;
  session: { id: string; pageUrl: string | null } | null;
  messages: TicketMessage[];
}

// ── Filter tabs ──────────────────────────────────────────

const STATUS_TABS: { label: string; value: TicketStatus | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Open", value: "open" },
  { label: "In Progress", value: "in_progress" },
  { label: "Resolved", value: "resolved" },
  { label: "Closed", value: "closed" },
];

// ── Badge helpers ────────────────────────────────────────

function statusBadgeClass(status: TicketStatus): string {
  switch (status) {
    case "open":
      return "bg-amber-500/10 text-amber-600 dark:text-amber-400";
    case "in_progress":
      return "bg-blue-500/10 text-blue-600 dark:text-blue-400";
    case "resolved":
      return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";
    case "closed":
      return "bg-gray-500/10 text-gray-500 dark:text-gray-400";
  }
}

function statusLabel(status: TicketStatus): string {
  switch (status) {
    case "open":
      return "Open";
    case "in_progress":
      return "In Progress";
    case "resolved":
      return "Resolved";
    case "closed":
      return "Closed";
  }
}

function priorityBadgeClass(priority: TicketPriority): string {
  switch (priority) {
    case "low":
      return "bg-gray-500/10 text-gray-500 dark:text-gray-400";
    case "medium":
      return "bg-amber-500/10 text-amber-600 dark:text-amber-400";
    case "high":
      return "bg-red-500/10 text-red-600 dark:text-red-400";
  }
}

function priorityLabel(priority: TicketPriority): string {
  return priority.charAt(0).toUpperCase() + priority.slice(1);
}

// ── Helpers ──────────────────────────────────────────────

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

function truncate(text: string, maxLen: number) {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen) + "...";
}

// ── Component ────────────────────────────────────────────

export default function TicketsClient() {
  const [tickets, setTickets] = useState<TicketSummary[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<TicketStatus | "all">("all");
  const [loading, setLoading] = useState(true);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<TicketDetail | null>(
    null
  );
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Editable fields in drawer
  const [editStatus, setEditStatus] = useState<TicketStatus>("open");
  const [editPriority, setEditPriority] = useState<TicketPriority>("low");
  const [editAgentId, setEditAgentId] = useState("");
  const [saving, setSaving] = useState(false);

  // ── Fetch tickets list ──────────────────────────────────

  const fetchTickets = useCallback(
    async (page: number, status: TicketStatus | "all") => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ page: String(page) });
        if (status !== "all") params.set("status", status);
        const res = await fetch(`/api/admin/support/tickets?${params}`);
        if (res.ok) {
          const data = await res.json();
          setTickets(data.tickets ?? []);
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
    fetchTickets(1, statusFilter);
  }, [fetchTickets, statusFilter]);

  // ── Fetch ticket detail ─────────────────────────────────

  const openTicket = useCallback(async (ticketId: string) => {
    setLoadingDetail(true);
    setDrawerOpen(true);
    try {
      const res = await fetch(`/api/admin/support/tickets/${ticketId}`);
      if (res.ok) {
        const data = await res.json();
        const ticket: TicketDetail = {
          ...data.ticket,
          session: data.session ?? null,
          messages: data.messages ?? [],
        };
        setSelectedTicket(ticket);
        setEditStatus(ticket.status);
        setEditPriority(ticket.priority);
        setEditAgentId(ticket.assignedAgentId ?? "");
      }
    } finally {
      setLoadingDetail(false);
    }
  }, []);

  // ── Save ticket updates ─────────────────────────────────

  const saveTicket = useCallback(async () => {
    if (!selectedTicket) return;
    setSaving(true);
    try {
      const res = await fetch(
        `/api/admin/support/tickets/${selectedTicket.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: editStatus,
            priority: editPriority,
            assignedAgentId: editAgentId || null,
          }),
        }
      );
      if (res.ok) {
        const data = await res.json();
        setSelectedTicket((prev) =>
          prev
            ? {
                ...prev,
                status: data.ticket.status,
                priority: data.ticket.priority,
                assignedAgentId: data.ticket.assignedAgentId,
              }
            : null
        );
        // Refresh list to reflect changes
        fetchTickets(currentPage, statusFilter);
      }
    } finally {
      setSaving(false);
    }
  }, [
    selectedTicket,
    editStatus,
    editPriority,
    editAgentId,
    fetchTickets,
    currentPage,
    statusFilter,
  ]);

  // ── Close drawer ────────────────────────────────────────

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false);
    setSelectedTicket(null);
  }, []);

  // ── Handle filter change ────────────────────────────────

  const handleFilterChange = useCallback(
    (status: TicketStatus | "all") => {
      setStatusFilter(status);
      setCurrentPage(1);
    },
    []
  );

  // ── Render ──────────────────────────────────────────────

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <a
          href="/admin/support"
          className="flex h-8 w-8 items-center justify-center rounded-md border border-[var(--border)] text-[var(--muted-foreground)] hover:bg-[var(--muted)] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </a>
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">
            Support Tickets
          </h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            Manage and resolve support tickets from users.
          </p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="mb-4 flex gap-1 rounded-lg border border-[var(--border)] bg-[var(--background)] p-1 w-fit">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => handleFilterChange(tab.value)}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              statusFilter === tab.value
                ? "bg-[var(--accent)] text-[var(--foreground)]"
                : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Loading state */}
      {loading && tickets.length === 0 ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-14 animate-pulse rounded-lg bg-[var(--muted)]"
            />
          ))}
        </div>
      ) : tickets.length === 0 ? (
        <div className="rounded-lg border border-[var(--border)] bg-[var(--background)] p-12 text-center">
          <p className="text-sm text-[var(--muted-foreground)]">
            No tickets found
            {statusFilter !== "all" ? ` with status "${statusLabel(statusFilter as TicketStatus)}"` : ""}.
          </p>
        </div>
      ) : (
        <>
          {/* Tickets table */}
          <div className="rounded-lg border border-[var(--border)] overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--muted)]/50">
                  <th className="px-4 py-3 text-left font-medium text-[var(--muted-foreground)]">
                    Subject
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-[var(--muted-foreground)]">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-[var(--muted-foreground)]">
                    Priority
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-[var(--muted-foreground)]">
                    Created
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-[var(--muted-foreground)]">
                    Agent
                  </th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((ticket) => (
                  <tr
                    key={ticket.id}
                    onClick={() => openTicket(ticket.id)}
                    className="cursor-pointer border-b border-[var(--border)] last:border-0 hover:bg-[var(--muted)]/30 transition-colors"
                  >
                    <td className="px-4 py-3 text-[var(--foreground)]">
                      {truncate(ticket.subject, 60)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${statusBadgeClass(ticket.status)}`}
                      >
                        {statusLabel(ticket.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${priorityBadgeClass(ticket.priority)}`}
                      >
                        {priorityLabel(ticket.priority)}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap font-mono text-xs text-[var(--muted-foreground)]">
                      {formatDate(ticket.createdAt)}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-[var(--muted-foreground)]">
                      {ticket.assignedAgentId
                        ? truncate(ticket.assignedAgentId, 12)
                        : "—"}
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
                  onClick={() => fetchTickets(currentPage - 1, statusFilter)}
                  disabled={currentPage <= 1 || loading}
                  className="flex items-center gap-1 rounded-md border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--muted-foreground)] hover:bg-[var(--muted)] transition-colors disabled:opacity-50"
                >
                  <ChevronLeft className="h-3 w-3" />
                  Previous
                </button>
                <button
                  onClick={() => fetchTickets(currentPage + 1, statusFilter)}
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

      {/* ── Detail Drawer (side panel) ──────────────────────── */}
      {drawerOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/30"
            onClick={closeDrawer}
          />

          {/* Drawer panel */}
          <div className="fixed inset-y-0 right-0 z-50 w-full max-w-lg border-l border-[var(--border)] bg-[var(--card)] shadow-xl overflow-y-auto">
            {loadingDetail ? (
              <div className="flex h-full items-center justify-center">
                <p className="text-sm text-[var(--muted-foreground)]">
                  Loading ticket...
                </p>
              </div>
            ) : selectedTicket ? (
              <div className="flex h-full flex-col">
                {/* Drawer header */}
                <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-4">
                  <h2 className="text-lg font-semibold text-[var(--foreground)] truncate pr-4">
                    {selectedTicket.subject}
                  </h2>
                  <button
                    onClick={closeDrawer}
                    className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md border border-[var(--border)] text-[var(--muted-foreground)] hover:bg-[var(--muted)] transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Drawer body */}
                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
                  {/* Status / Priority / Agent controls */}
                  <div className="grid gap-4 sm:grid-cols-3">
                    {/* Status */}
                    <div>
                      <label className="mb-1 block text-xs font-medium text-[var(--muted-foreground)]">
                        Status
                      </label>
                      <select
                        value={editStatus}
                        onChange={(e) =>
                          setEditStatus(e.target.value as TicketStatus)
                        }
                        className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-1.5 text-sm text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                      >
                        <option value="open">Open</option>
                        <option value="in_progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                        <option value="closed">Closed</option>
                      </select>
                    </div>

                    {/* Priority */}
                    <div>
                      <label className="mb-1 block text-xs font-medium text-[var(--muted-foreground)]">
                        Priority
                      </label>
                      <select
                        value={editPriority}
                        onChange={(e) =>
                          setEditPriority(e.target.value as TicketPriority)
                        }
                        className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-1.5 text-sm text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    </div>

                    {/* Assigned Agent */}
                    <div>
                      <label className="mb-1 block text-xs font-medium text-[var(--muted-foreground)]">
                        Assigned Agent
                      </label>
                      <input
                        type="text"
                        value={editAgentId}
                        onChange={(e) => setEditAgentId(e.target.value)}
                        placeholder="Agent ID"
                        className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-1.5 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                      />
                    </div>
                  </div>

                  {/* Save button */}
                  <button
                    onClick={saveTicket}
                    disabled={saving}
                    className="rounded-md bg-[var(--foreground)] px-4 py-2 text-sm font-medium text-[var(--background)] hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </button>

                  {/* Conversation thread */}
                  <div>
                    <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
                      Conversation
                    </h3>

                    {selectedTicket.messages.length === 0 ? (
                      <div className="rounded-lg border border-[var(--border)] bg-[var(--background)] p-6 text-center text-sm text-[var(--muted-foreground)]">
                        No messages in this ticket.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {selectedTicket.messages.map((msg) => {
                          const isUser = msg.role === "user";
                          return (
                            <div key={msg.id} className="flex gap-3">
                              {/* Role indicator */}
                              <div
                                className={`mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                                  isUser
                                    ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                                    : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                }`}
                              >
                                {isUser ? "U" : "A"}
                              </div>

                              {/* Message */}
                              <div className="flex-1 min-w-0">
                                <div className="mb-1 flex items-center gap-2">
                                  <span
                                    className={`text-xs font-semibold ${
                                      isUser
                                        ? "text-blue-600 dark:text-blue-400"
                                        : "text-emerald-600 dark:text-emerald-400"
                                    }`}
                                  >
                                    {isUser ? "User" : "Agent"}
                                  </span>
                                  <span className="text-[10px] text-[var(--muted-foreground)]">
                                    {formatTime(msg.createdAt)}
                                  </span>
                                </div>
                                <div
                                  className={`rounded-lg px-3 py-2 text-sm ${
                                    isUser
                                      ? "bg-blue-500/5 border border-blue-500/10 text-[var(--foreground)]"
                                      : "bg-emerald-500/5 border border-emerald-500/10 text-[var(--foreground)]"
                                  }`}
                                >
                                  <p className="whitespace-pre-wrap">
                                    {msg.content}
                                  </p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Drawer footer with created date */}
                <div className="border-t border-[var(--border)] px-6 py-3">
                  <p className="text-xs text-[var(--muted-foreground)]">
                    Created {formatDate(selectedTicket.createdAt)}
                  </p>
                </div>
              </div>
            ) : null}
          </div>
        </>
      )}
    </div>
  );
}
