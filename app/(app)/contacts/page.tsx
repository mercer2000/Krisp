"use client";

import { useState, useEffect, useCallback } from "react";
import type { ContactListItem, ContactDetail, ContactRecentEmail } from "@/types/contact";

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

function SearchIcon({ size = 16 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

function UserIcon({ size = 20 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function MailIcon({ size = 14 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}

function RefreshIcon({ size = 16 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
      <path d="M8 16H3v5" />
    </svg>
  );
}

function CloseIcon({ size = 16 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<ContactListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"frequency" | "recent" | "name">("frequency");
  const [rebuilding, setRebuilding] = useState(false);
  const [selectedContact, setSelectedContact] = useState<ContactDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const limit = 50;

  const fetchContacts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        sort,
      });
      if (search) params.set("q", search);

      const res = await fetch(`/api/contacts?${params}`);
      if (!res.ok) throw new Error("Failed to fetch contacts");
      const json = await res.json();
      setContacts(json.data);
      setTotal(json.total);
    } catch (err) {
      console.error("Error fetching contacts:", err);
    } finally {
      setLoading(false);
    }
  }, [page, search, sort]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  const handleRebuild = async () => {
    setRebuilding(true);
    try {
      const res = await fetch("/api/contacts", { method: "POST" });
      if (!res.ok) throw new Error("Failed to rebuild");
      const json = await res.json();
      alert(`Extracted ${json.count} contacts from existing emails.`);
      setPage(1);
      await fetchContacts();
    } catch (err) {
      console.error("Error rebuilding contacts:", err);
      alert("Failed to rebuild contacts.");
    } finally {
      setRebuilding(false);
    }
  };

  const handleSelectContact = async (contact: ContactListItem) => {
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/contacts/${contact.id}`);
      if (!res.ok) throw new Error("Failed to fetch contact detail");
      const json: ContactDetail = await res.json();
      setSelectedContact(json);
    } catch (err) {
      console.error("Error fetching contact detail:", err);
    } finally {
      setDetailLoading(false);
    }
  };

  const totalPages = Math.ceil(total / limit);

  const getInitials = (contact: ContactListItem) => {
    if (contact.display_name) {
      const parts = contact.display_name.split(" ");
      return parts.length > 1
        ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
        : parts[0][0].toUpperCase();
    }
    return contact.email[0].toUpperCase();
  };

  return (
    <div className="flex h-full">
      {/* Contact List */}
      <div className={`flex flex-col ${selectedContact ? "w-1/2 border-r border-[var(--border)]" : "w-full"} h-full`}>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-4">
          <div>
            <h1 className="text-xl font-bold text-[var(--foreground)]">Contacts</h1>
            <p className="text-sm text-[var(--muted-foreground)]">
              {total} contact{total !== 1 ? "s" : ""}
            </p>
          </div>
          <button
            onClick={handleRebuild}
            disabled={rebuilding}
            className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--accent)] disabled:opacity-50"
          >
            <RefreshIcon size={14} />
            {rebuilding ? "Syncing..." : "Sync Contacts"}
          </button>
        </div>

        {/* Search and Sort */}
        <div className="flex items-center gap-3 border-b border-[var(--border)] px-6 py-3">
          <div className="relative flex-1">
            <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]">
              <SearchIcon size={14} />
            </div>
            <input
              type="text"
              placeholder="Search contacts..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] py-2 pl-9 pr-3 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:border-[var(--primary)] focus:outline-none"
            />
          </div>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as "frequency" | "recent" | "name")}
            className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none"
          >
            <option value="frequency">Most Emails</option>
            <option value="recent">Most Recent</option>
            <option value="name">Name A-Z</option>
          </select>
        </div>

        {/* Contact List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-sm text-[var(--muted-foreground)]">
              Loading contacts...
            </div>
          ) : contacts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <UserIcon size={48} />
              <p className="mt-4 text-sm font-medium text-[var(--foreground)]">
                No contacts found
              </p>
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                Click &quot;Sync Contacts&quot; to extract contacts from your emails.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[var(--border)]">
              {contacts.map((contact) => (
                <button
                  key={contact.id}
                  onClick={() => handleSelectContact(contact)}
                  className={`flex w-full items-center gap-4 px-6 py-3 text-left transition-colors hover:bg-[var(--accent)] ${
                    selectedContact?.id === contact.id ? "bg-[var(--accent)]" : ""
                  }`}
                >
                  {/* Avatar */}
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[var(--primary)]/10 text-sm font-semibold text-[var(--primary)]">
                    {getInitials(contact)}
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium text-[var(--foreground)]">
                        {contact.display_name ?? contact.email}
                      </span>
                    </div>
                    {contact.display_name && (
                      <p className="truncate text-xs text-[var(--muted-foreground)]">
                        {contact.email}
                      </p>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="flex flex-shrink-0 flex-col items-end gap-1">
                    <span className="flex items-center gap-1 text-xs text-[var(--muted-foreground)]">
                      <MailIcon size={12} />
                      {contact.email_count}
                    </span>
                    {contact.last_email_at && (
                      <span className="text-xs text-[var(--muted-foreground)]">
                        {formatRelativeTime(contact.last_email_at)}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-[var(--border)] px-6 py-3">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--accent)] disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-sm text-[var(--muted-foreground)]">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--accent)] disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Contact Detail Panel */}
      {selectedContact && (
        <div className="flex w-1/2 flex-col h-full">
          {/* Detail Header */}
          <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--primary)]/10 text-base font-semibold text-[var(--primary)]">
                {getInitials(selectedContact)}
              </div>
              <div>
                <h2 className="text-lg font-semibold text-[var(--foreground)]">
                  {selectedContact.display_name ?? selectedContact.email}
                </h2>
                {selectedContact.display_name && (
                  <p className="text-sm text-[var(--muted-foreground)]">
                    {selectedContact.email}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={() => setSelectedContact(null)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--muted-foreground)] transition-colors hover:bg-[var(--accent)] hover:text-[var(--foreground)]"
            >
              <CloseIcon size={16} />
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 border-b border-[var(--border)] px-6 py-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-[var(--foreground)]">
                {selectedContact.email_count}
              </div>
              <div className="text-xs text-[var(--muted-foreground)]">Total Emails</div>
            </div>
            <div className="text-center">
              <div className="text-sm font-medium text-[var(--foreground)]">
                {selectedContact.last_email_at
                  ? formatRelativeTime(selectedContact.last_email_at)
                  : "N/A"}
              </div>
              <div className="text-xs text-[var(--muted-foreground)]">Last Email</div>
            </div>
            <div className="text-center">
              <div className="text-sm font-medium text-[var(--foreground)]">
                {new Date(selectedContact.first_seen_at).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </div>
              <div className="text-xs text-[var(--muted-foreground)]">First Seen</div>
            </div>
          </div>

          {/* Recent Emails */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <h3 className="mb-3 text-sm font-semibold text-[var(--foreground)]">
              Recent Emails
            </h3>
            {detailLoading ? (
              <p className="text-sm text-[var(--muted-foreground)]">Loading...</p>
            ) : selectedContact.recent_emails?.length === 0 ? (
              <p className="text-sm text-[var(--muted-foreground)]">
                No recent emails found.
              </p>
            ) : (
              <div className="space-y-2">
                {selectedContact.recent_emails?.map((email) => (
                  <a
                    key={`${email.provider}-${email.id}`}
                    href={`/inbox/${email.id}`}
                    className="flex items-center gap-3 rounded-lg border border-[var(--border)] px-4 py-3 text-sm transition-colors hover:bg-[var(--accent)]"
                  >
                    <MailIcon size={14} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-[var(--foreground)]">
                        {email.subject ?? "(No subject)"}
                      </p>
                      <p className="text-xs text-[var(--muted-foreground)]">
                        {formatRelativeTime(email.received_at)} · {email.provider}
                      </p>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
