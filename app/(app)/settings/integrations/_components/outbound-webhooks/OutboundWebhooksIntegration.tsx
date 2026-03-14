"use client";

import { useState, useEffect, useCallback } from "react";
import { IntegrationDetailLayout } from "../IntegrationDetailLayout";
import { getIntegration } from "../integrations";
import { CodeBlock } from "../shared";

const EVENT_OPTIONS = [
  { value: "card.created", label: "Card Created", description: "When a new Kanban card is created" },
  { value: "meeting.ingested", label: "Meeting Ingested", description: "When a Krisp meeting is received" },
  { value: "email.received", label: "Email Received", description: "When a new email is ingested" },
  { value: "thought.captured", label: "Thought Captured", description: "When a new thought is saved via Brain chat" },
] as const;

interface OutboundWebhook {
  id: string;
  name: string;
  url: string;
  events: string[];
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

interface WebhookDelivery {
  id: string;
  eventType: string;
  statusCode: number | null;
  success: boolean;
  errorMessage: string | null;
  sentAt: string;
}

export function OutboundWebhooksIntegration({ tenantId: _tenantId }: { tenantId: string }) {
  const integration = getIntegration("outbound-webhooks")!;

  const [webhooks, setWebhooks] = useState<OutboundWebhook[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deliveries, setDeliveries] = useState<WebhookDelivery[]>([]);
  const [loadingDeliveries, setLoadingDeliveries] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form fields
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [secret, setSecret] = useState("");
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const fetchWebhooks = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/outbound-webhooks");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setWebhooks(data.webhooks || []);
    } catch {
      setError("Failed to load outbound webhooks");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWebhooks();
  }, [fetchWebhooks]);

  const fetchDeliveries = async (webhookId: string) => {
    if (expandedId === webhookId) {
      setExpandedId(null);
      return;
    }
    setLoadingDeliveries(true);
    setExpandedId(webhookId);
    try {
      const res = await fetch(`/api/outbound-webhooks/${webhookId}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setDeliveries(data.deliveries || []);
    } catch {
      setDeliveries([]);
    } finally {
      setLoadingDeliveries(false);
    }
  };

  const resetForm = () => {
    setName("");
    setUrl("");
    setSecret("");
    setSelectedEvents([]);
    setShowForm(false);
    setEditingId(null);
  };

  const startEdit = (hook: OutboundWebhook) => {
    setName(hook.name);
    setUrl(hook.url);
    setSecret("");
    setSelectedEvents(hook.events);
    setEditingId(hook.id);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!name.trim() || !url.trim() || selectedEvents.length === 0) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const body: Record<string, unknown> = {
        name: name.trim(),
        url: url.trim(),
        events: selectedEvents,
      };
      if (secret.trim()) body.secret = secret.trim();

      const isEdit = !!editingId;
      const endpoint = isEdit
        ? `/api/outbound-webhooks/${editingId}`
        : "/api/outbound-webhooks";
      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save");
      }

      setSuccess(isEdit ? "Webhook updated" : "Webhook created");
      setTimeout(() => setSuccess(null), 3000);
      resetForm();
      await fetchWebhooks();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save webhook");
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (hook: OutboundWebhook) => {
    setError(null);
    try {
      const res = await fetch(`/api/outbound-webhooks/${hook.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !hook.active }),
      });
      if (!res.ok) throw new Error("Failed to update");
      await fetchWebhooks();
    } catch {
      setError("Failed to toggle webhook");
    }
  };

  const handleDelete = async (id: string) => {
    setError(null);
    try {
      const res = await fetch(`/api/outbound-webhooks/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete");
      setSuccess("Webhook deleted");
      setTimeout(() => setSuccess(null), 3000);
      if (expandedId === id) setExpandedId(null);
      await fetchWebhooks();
    } catch {
      setError("Failed to delete webhook");
    }
  };

  const toggleEvent = (event: string) => {
    setSelectedEvents((prev) =>
      prev.includes(event)
        ? prev.filter((e) => e !== event)
        : [...prev, event]
    );
  };

  const isConnected = webhooks.some((h) => h.active);

  const connectionSection = (
    <div className="space-y-6">
      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-600">
          {error}
        </div>
      )}
      {success && (
        <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-sm text-green-600">
          {success}
        </div>
      )}

      {/* How it works */}
      <div>
        <h3 className="text-sm font-semibold text-[var(--foreground)] mb-2">
          How It Works
        </h3>
        <p className="text-sm text-[var(--muted-foreground)]">
          Register webhook URLs that will receive a POST request with JSON payload whenever selected events
          occur. Each payload includes the event type, entity ID, and a snapshot of the relevant data.
          Ideal for connecting to Zapier, Make (Integromat), or your own automation endpoints.
        </p>
      </div>

      {/* Payload format */}
      <div>
        <h3 className="text-sm font-semibold text-[var(--foreground)] mb-2">
          Payload Format
        </h3>
        <CodeBlock>{`{
  "event": "card.created",
  "timestamp": "2026-03-04T12:00:00.000Z",
  "data": {
    "entityId": "uuid-or-id",
    "title": "...",
    ...snapshot fields
  }
}`}</CodeBlock>
        <p className="text-xs text-[var(--muted-foreground)] mt-2">
          If you configure a signing secret, each request includes an{" "}
          <code className="px-1 py-0.5 rounded bg-[var(--secondary)] text-[var(--foreground)]">X-Webhook-Signature</code>{" "}
          header with an HMAC-SHA256 hex digest of the body.
        </p>
      </div>

      {/* Existing webhooks */}
      {loading ? (
        <div className="p-4 rounded-lg bg-[var(--secondary)] border border-[var(--border)] text-sm text-[var(--muted-foreground)]">
          Loading...
        </div>
      ) : (
        <>
          {webhooks.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-[var(--foreground)]">
                Registered Webhooks
              </h3>
              {webhooks.map((hook) => (
                <div key={hook.id} className="rounded-lg border border-[var(--border)] bg-[var(--secondary)]/50 overflow-hidden">
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${hook.active ? "bg-green-500" : "bg-gray-400"}`} />
                          <span className="text-sm font-medium text-[var(--foreground)] truncate">{hook.name}</span>
                        </div>
                        <p className="text-xs text-[var(--muted-foreground)] mt-1 font-mono truncate">{hook.url}</p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {hook.events.map((event) => (
                            <span key={event} className="px-2 py-0.5 text-xs rounded-full bg-[var(--primary)]/10 text-[var(--primary)]">
                              {event}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => fetchDeliveries(hook.id)}
                          className="px-2 py-1 text-xs rounded-md border border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--accent)] transition-colors"
                          title="View delivery history"
                        >
                          {expandedId === hook.id ? "Hide" : "History"}
                        </button>
                        <button
                          onClick={() => handleToggle(hook)}
                          className={`px-2 py-1 text-xs rounded-md border transition-colors ${
                            hook.active
                              ? "border-amber-500/30 text-amber-600 hover:bg-amber-500/10"
                              : "border-green-500/30 text-green-600 hover:bg-green-500/10"
                          }`}
                        >
                          {hook.active ? "Pause" : "Enable"}
                        </button>
                        <button
                          onClick={() => startEdit(hook)}
                          className="px-2 py-1 text-xs rounded-md border border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--accent)] transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(hook.id)}
                          className="px-2 py-1 text-xs rounded-md border border-red-500/30 text-red-600 hover:bg-red-500/10 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Delivery history */}
                  {expandedId === hook.id && (
                    <div className="border-t border-[var(--border)] p-4">
                      <h4 className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-2">
                        Recent Deliveries
                      </h4>
                      {loadingDeliveries ? (
                        <p className="text-xs text-[var(--muted-foreground)]">Loading...</p>
                      ) : deliveries.length === 0 ? (
                        <p className="text-xs text-[var(--muted-foreground)]">No deliveries yet</p>
                      ) : (
                        <div className="space-y-1.5">
                          {deliveries.map((d) => (
                            <div key={d.id} className="flex items-center gap-3 text-xs">
                              <span className={`w-2 h-2 rounded-full shrink-0 ${d.success ? "bg-green-500" : "bg-red-500"}`} />
                              <span className="text-[var(--muted-foreground)] w-28 shrink-0">
                                {new Date(d.sentAt).toLocaleString()}
                              </span>
                              <span className="px-1.5 py-0.5 rounded bg-[var(--secondary)] text-[var(--foreground)] font-mono">
                                {d.eventType}
                              </span>
                              <span className={`font-mono ${d.success ? "text-green-600" : "text-red-600"}`}>
                                {d.statusCode ?? "ERR"}
                              </span>
                              {d.errorMessage && (
                                <span className="text-red-500 truncate">{d.errorMessage}</span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Add / Edit form */}
      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 text-sm font-medium rounded-md border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--accent)] transition-colors"
        >
          + Add Webhook
        </button>
      ) : (
        <div className="p-5 rounded-lg border border-[var(--border)] bg-[var(--secondary)]/50 space-y-4">
          <h3 className="text-sm font-semibold text-[var(--foreground)]">
            {editingId ? "Edit Webhook" : "New Webhook"}
          </h3>

          <div>
            <label className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Zapier - New Cards"
              className="mt-1 w-full px-3 py-2 text-sm rounded-md border border-[var(--border)] bg-[var(--secondary)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">
              URL <span className="text-red-500">*</span>
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://hooks.zapier.com/hooks/catch/..."
              className="mt-1 w-full px-3 py-2 text-sm rounded-md border border-[var(--border)] bg-[var(--secondary)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] font-mono focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">
              Signing Secret (optional)
            </label>
            <input
              type="password"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              placeholder="HMAC-SHA256 signing key"
              className="mt-1 w-full px-3 py-2 text-sm rounded-md border border-[var(--border)] bg-[var(--secondary)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
            />
            <p className="mt-1 text-xs text-[var(--muted-foreground)]">
              If set, payloads are signed with HMAC-SHA256. Verify via the X-Webhook-Signature header.
            </p>
          </div>

          <div>
            <label className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider mb-2 block">
              Events <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2">
              {EVENT_OPTIONS.map((opt) => (
                <label key={opt.value} className="flex items-start gap-3 p-3 rounded-lg border border-[var(--border)] hover:bg-[var(--accent)] cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={selectedEvents.includes(opt.value)}
                    onChange={() => toggleEvent(opt.value)}
                    className="mt-0.5 rounded border-[var(--border)]"
                  />
                  <div>
                    <span className="text-sm font-medium text-[var(--foreground)]">{opt.label}</span>
                    <p className="text-xs text-[var(--muted-foreground)]">{opt.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving || !name.trim() || !url.trim() || selectedEvents.length === 0}
              className="px-4 py-2 text-sm font-medium rounded-md bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {saving ? "Saving..." : editingId ? "Update Webhook" : "Create Webhook"}
            </button>
            <button
              onClick={resetForm}
              className="px-4 py-2 text-sm font-medium rounded-md border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--accent)] transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <IntegrationDetailLayout
      integration={integration}
      connected={isConnected}
      connectionSection={connectionSection}
    />
  );
}
