"use client";

import { useState, useEffect, useCallback } from "react";

function CopyButton({ text }: { text: string }) {
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

function CodeBlock({ children }: { children: string }) {
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

const FIELD_MAPPING = [
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

const CRISP_EVENTS = [
  { event: "key_points_generated", description: "Fired when Crisp extracts key points from a completed meeting" },
  { event: "transcript_created", description: "Fired when a full meeting transcript becomes available" },
];

const GMAIL_FIELD_MAPPING = [
  { appsScript: "msg.getId()", payload: "messageId", description: "Unique Gmail message identifier (required for dedup)" },
  { appsScript: "msg.getFrom()", payload: "sender", description: "Sender email address" },
  { appsScript: "msg.getTo()", payload: "recipients", description: "Comma-separated recipient addresses" },
  { appsScript: "msg.getSubject()", payload: "subject", description: "Email subject line" },
  { appsScript: "msg.getPlainBody()", payload: "bodyPlain", description: "Plain text body" },
  { appsScript: "msg.getBody()", payload: "bodyHtml", description: "HTML body content" },
  { appsScript: "msg.getDate().toISOString()", payload: "receivedAt", description: "ISO 8601 timestamp" },
];

const TABS = [
  {
    id: "microsoft365" as const,
    label: "Microsoft 365",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M11.5 3v8.5H3V3h8.5zm0 18H3v-8.5h8.5V21zm1-18H21v8.5h-8.5V3zm0 18v-8.5H21V21h-8.5z" />
      </svg>
    ),
    color: "#0078D4",
  },
  {
    id: "graph" as const,
    label: "Graph API",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M21.17 3.25q.33 0 .59.25.24.25.24.58 0 .34-.24.59l-7.83 7.83L15 15.58l-1.41-1.41 1.07-1.08-7.83-7.83a.81.81 0 0 1-.25-.59q0-.33.25-.58.26-.25.59-.25.33 0 .58.25l7 7 7-7q.25-.25.58-.25zM3.83 19q0-.41.29-.71.3-.29.71-.29h14.34q.41 0 .71.29.29.3.29.71 0 .41-.29.71-.3.29-.71.29H4.83q-.41 0-.71-.29Q3.83 19.41 3.83 19z" />
      </svg>
    ),
    color: "#0078D4",
  },
  {
    id: "gmail" as const,
    label: "Gmail",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M20 18h-2V9.25L12 13 6 9.25V18H4V6h1.2l6.8 4.25L18.8 6H20m0-2H4c-1.11 0-2 .89-2 2v12a2 2 0 002 2h16a2 2 0 002-2V6a2 2 0 00-2-2z" />
      </svg>
    ),
    color: "#EA4335",
  },
  {
    id: "zoom" as const,
    label: "Zoom Chat",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M4 3a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h8l4 4v-4h4a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2H4z" />
      </svg>
    ),
    color: "#2D8CFF",
  },
  {
    id: "outlook" as const,
    label: "Outlook.com",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
      </svg>
    ),
    color: "#0078D4",
  },
  {
    id: "crisp" as const,
    label: "Krisp Meetings",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 18.5a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13Z" />
        <path d="M12 2v2" />
        <path d="M12 20v2" />
        <path d="m4.93 4.93 1.41 1.41" />
        <path d="m17.66 17.66 1.41 1.41" />
        <path d="M2 12h2" />
        <path d="M20 12h2" />
        <path d="m6.34 17.66-1.41 1.41" />
        <path d="m19.07 4.93-1.41 1.41" />
      </svg>
    ),
    color: "#4B45DC",
  },
] as const;

type TabId = (typeof TABS)[number]["id"];

function WebhookSecretManager() {
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

interface GraphSubscription {
  id: string;
  subscriptionId: string;
  credentialId: string | null;
  resource: string;
  changeType: string;
  expirationDateTime: string;
  active: boolean;
}

interface GraphCredential {
  id: string;
  label: string;
  azureTenantId: string;
  clientId: string;
  clientSecretHint: string;
  createdAt: string;
  updatedAt: string;
}

function GraphCredentialsManager({
  onCredentialsChange,
}: {
  onCredentialsChange: (credentials: GraphCredential[]) => void;
}) {
  const [credentials, setCredentials] = useState<GraphCredential[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [label, setLabel] = useState("");
  const [azureTenantId, setAzureTenantId] = useState("");
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [saving, setSaving] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCredentials = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/graph/credentials");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      const creds = data.credentials || [];
      setCredentials(creds);
      onCredentialsChange(creds);
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  }, [onCredentialsChange]);

  useEffect(() => {
    fetchCredentials();
  }, [fetchCredentials]);

  const handleSave = async () => {
    if (!azureTenantId.trim() || !clientId.trim() || !clientSecret.trim()) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch("/api/graph/credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: label.trim() || undefined,
          azureTenantId: azureTenantId.trim(),
          clientId: clientId.trim(),
          clientSecret: clientSecret.trim(),
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save");
      }
      setSuccess("Connection added successfully");
      setLabel("");
      setAzureTenantId("");
      setClientId("");
      setClientSecret("");
      setShowForm(false);
      setTimeout(() => setSuccess(null), 5000);
      await fetchCredentials();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save credentials");
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async (credentialId: string) => {
    setTestingId(credentialId);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch("/api/graph/credentials", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credentialId }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error || "Token test failed");
        return;
      }
      setSuccess("Connection successful — obtained access token from Azure AD");
      setTimeout(() => setSuccess(null), 5000);
    } catch {
      setError("Failed to test connection");
    } finally {
      setTestingId(null);
    }
  };

  const handleRemove = async (credentialId: string) => {
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch("/api/graph/credentials", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credentialId }),
      });
      if (!res.ok) throw new Error("Failed to remove");
      setSuccess("Connection removed");
      setTimeout(() => setSuccess(null), 3000);
      await fetchCredentials();
    } catch {
      setError("Failed to remove credentials");
    }
  };

  if (loading) {
    return (
      <div className="p-4 rounded-lg bg-[var(--secondary)] border border-[var(--border)] text-sm text-[var(--muted-foreground)]">
        Loading...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Existing credentials list */}
      {credentials.length > 0 && (
        <div className="space-y-3">
          {credentials.map((cred) => (
            <div key={cred.id} className="p-4 rounded-lg bg-green-500/10 border border-green-500/20 space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-sm font-medium text-green-600">{cred.label}</span>
              </div>
              <div className="text-xs text-[var(--muted-foreground)] space-y-1">
                <p>Azure Tenant: <code className="px-1 py-0.5 rounded bg-[var(--secondary)] text-[var(--foreground)]">{cred.azureTenantId}</code></p>
                <p>Client ID: <code className="px-1 py-0.5 rounded bg-[var(--secondary)] text-[var(--foreground)]">{cred.clientId}</code></p>
                <p>Client Secret: <code className="px-1 py-0.5 rounded bg-[var(--secondary)] text-[var(--foreground)]">{cred.clientSecretHint}</code></p>
              </div>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => handleTest(cred.id)}
                  disabled={testingId !== null}
                  className="px-3 py-1.5 text-xs font-medium rounded-md border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] hover:bg-[var(--accent)] transition-colors disabled:opacity-50"
                >
                  {testingId === cred.id ? "Testing..." : "Test Connection"}
                </button>
                <button
                  onClick={() => handleRemove(cred.id)}
                  className="px-3 py-1.5 text-xs font-medium rounded-md border border-red-500/30 text-red-600 hover:bg-red-500/10 transition-colors"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add connection button / form */}
      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 text-sm font-medium rounded-md border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--accent)] transition-colors"
        >
          + Add Connection
        </button>
      ) : (
        <div className="p-5 rounded-lg border border-[var(--border)] bg-[var(--secondary)]/50 space-y-4">
          <div>
            <label className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">
              Connection Label
            </label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. Sales Team Inbox, Support Mailbox"
              className="mt-1 w-full px-3 py-2 text-sm rounded-md border border-[var(--border)] bg-[var(--secondary)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
            />
            <p className="mt-1 text-xs text-[var(--muted-foreground)]">
              A friendly name to identify this connection. Defaults to &ldquo;Default&rdquo; if left blank.
            </p>
          </div>

          <div>
            <label className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">
              Azure Tenant ID <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={azureTenantId}
              onChange={(e) => setAzureTenantId(e.target.value)}
              placeholder="e.g. 12345678-abcd-1234-abcd-123456789abc"
              className="mt-1 w-full px-3 py-2 text-sm rounded-md border border-[var(--border)] bg-[var(--secondary)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] font-mono focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
            />
            <p className="mt-1 text-xs text-[var(--muted-foreground)]">
              Found in Azure Portal &rarr; Azure Active Directory &rarr; Overview &rarr; Tenant ID
            </p>
          </div>

          <div>
            <label className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">
              Application (Client) ID <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              placeholder="e.g. 12345678-abcd-1234-abcd-123456789abc"
              className="mt-1 w-full px-3 py-2 text-sm rounded-md border border-[var(--border)] bg-[var(--secondary)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] font-mono focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
            />
            <p className="mt-1 text-xs text-[var(--muted-foreground)]">
              Found in Azure Portal &rarr; App registrations &rarr; Your app &rarr; Application (client) ID
            </p>
          </div>

          <div>
            <label className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">
              Client Secret <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              value={clientSecret}
              onChange={(e) => setClientSecret(e.target.value)}
              placeholder="Paste the client secret value"
              className="mt-1 w-full px-3 py-2 text-sm rounded-md border border-[var(--border)] bg-[var(--secondary)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
            />
            <p className="mt-1 text-xs text-[var(--muted-foreground)]">
              Found in Azure Portal &rarr; App registrations &rarr; Your app &rarr; Certificates &amp; secrets
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving || !azureTenantId.trim() || !clientId.trim() || !clientSecret.trim()}
              className="px-4 py-2 text-sm font-medium rounded-md bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Connection"}
            </button>
            <button
              onClick={() => {
                setShowForm(false);
                setLabel("");
                setAzureTenantId("");
                setClientId("");
                setClientSecret("");
              }}
              className="px-4 py-2 text-sm font-medium rounded-md border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--accent)] transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

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
    </div>
  );
}

function GraphSubscriptionManager({
  graphWebhookUrl,
  credentials,
}: {
  graphWebhookUrl: string;
  credentials: GraphCredential[];
}) {
  const [selectedCredentialId, setSelectedCredentialId] = useState("");
  const [mailbox, setMailbox] = useState("");
  const [clientState, setClientState] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [subscriptions, setSubscriptions] = useState<GraphSubscription[]>([]);
  const [loadingSubs, setLoadingSubs] = useState(true);

  // Auto-select the first credential when credentials load
  useEffect(() => {
    if (credentials.length > 0 && !selectedCredentialId) {
      setSelectedCredentialId(credentials[0].id);
    }
    // Clear selection if the selected credential was removed
    if (selectedCredentialId && !credentials.find((c) => c.id === selectedCredentialId)) {
      setSelectedCredentialId(credentials[0]?.id || "");
    }
  }, [credentials, selectedCredentialId]);

  const fetchSubscriptions = useCallback(async () => {
    try {
      setLoadingSubs(true);
      const res = await fetch("/api/graph/subscriptions");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setSubscriptions(data.subscriptions || []);
    } catch {
      // Silently fail — subscriptions list is supplementary
    } finally {
      setLoadingSubs(false);
    }
  }, []);

  useEffect(() => {
    fetchSubscriptions();
  }, [fetchSubscriptions]);

  const handleCreate = async () => {
    setCreating(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch("/api/graph/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          credentialId: selectedCredentialId,
          mailbox: mailbox.trim(),
          clientState: clientState.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.detail || data.error || "Failed to create subscription");
        return;
      }
      setSuccess(
        `Subscription created (ID: ${data.subscription.subscriptionId.slice(0, 8)}...). Expires: ${new Date(data.subscription.expirationDateTime).toLocaleString()}`
      );
      setClientState("");
      setTimeout(() => setSuccess(null), 8000);
      await fetchSubscriptions();
    } catch {
      setError("Failed to create subscription");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (subscriptionId: string) => {
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch("/api/graph/subscriptions", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscriptionId }),
      });
      if (!res.ok) throw new Error("Failed to delete");
      setSuccess("Subscription deleted");
      setTimeout(() => setSuccess(null), 3000);
      await fetchSubscriptions();
    } catch {
      setError("Failed to delete subscription");
    }
  };

  const isExpired = (dateStr: string) => new Date(dateStr) < new Date();

  const getCredentialLabel = (credentialId: string | null) => {
    if (!credentialId) return null;
    return credentials.find((c) => c.id === credentialId)?.label || null;
  };

  return (
    <div className="space-y-6">
      {/* Create subscription form */}
      <div className="p-5 rounded-lg border border-[var(--border)] bg-[var(--secondary)]/50 space-y-4">
        {credentials.length === 0 && (
          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-sm text-amber-600">
            Add at least one Azure AD connection above before creating a subscription.
          </div>
        )}

        {credentials.length > 0 && (
          <div>
            <label className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">
              Connection <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedCredentialId}
              onChange={(e) => setSelectedCredentialId(e.target.value)}
              className="mt-1 w-full px-3 py-2 text-sm rounded-md border border-[var(--border)] bg-[var(--secondary)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
            >
              {credentials.map((cred) => (
                <option key={cred.id} value={cred.id}>
                  {cred.label} ({cred.azureTenantId.slice(0, 8)}...)
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-[var(--muted-foreground)]">
              Select which Azure AD connection to use for this subscription.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">
              Mailbox Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={mailbox}
              onChange={(e) => setMailbox(e.target.value)}
              placeholder="user@yourdomain.com"
              className="mt-1 w-full px-3 py-2 text-sm rounded-md border border-[var(--border)] bg-[var(--secondary)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] font-mono focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
            />
            <p className="mt-1 text-xs text-[var(--muted-foreground)]">
              The Microsoft 365 mailbox to monitor for new emails.
            </p>
          </div>
          <div>
            <label className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">
              Client State{" "}
              <span className="normal-case font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={clientState}
              onChange={(e) => setClientState(e.target.value)}
              placeholder="Auto-generated if empty"
              className="mt-1 w-full px-3 py-2 text-sm rounded-md border border-[var(--border)] bg-[var(--secondary)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] font-mono focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
            />
          </div>
        </div>

        {mailbox.trim() && (
          <div>
            <label className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">
              Resource
            </label>
            <div className="mt-1 flex items-center p-2 rounded-md bg-[var(--secondary)] border border-[var(--border)]">
              <code className="flex-1 text-sm text-[var(--muted-foreground)] break-all">
                users/{mailbox.trim()}/mailFolders/inbox/messages
              </code>
            </div>
          </div>
        )}

        <div>
          <label className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">
            Notification URL
          </label>
          <div className="mt-1 flex items-center p-2 rounded-md bg-[var(--secondary)] border border-[var(--border)]">
            <code className="flex-1 text-sm text-[var(--muted-foreground)] break-all">
              {graphWebhookUrl}
            </code>
          </div>
          <p className="mt-1 text-xs text-[var(--muted-foreground)]">
            Set automatically. Expiration is set to ~3 days (the maximum for
            mail resources).
          </p>
        </div>

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

        <button
          onClick={handleCreate}
          disabled={creating || credentials.length === 0 || !selectedCredentialId || !mailbox.trim()}
          className="px-4 py-2 text-sm font-medium rounded-md bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {creating ? "Creating..." : "Create Subscription"}
        </button>
      </div>

      {/* Active subscriptions list */}
      <div>
        <h4 className="text-sm font-semibold text-[var(--foreground)] mb-3">
          Active Subscriptions
        </h4>
        {loadingSubs ? (
          <div className="p-4 rounded-lg bg-[var(--secondary)] border border-[var(--border)] text-sm text-[var(--muted-foreground)]">
            Loading...
          </div>
        ) : subscriptions.length === 0 ? (
          <div className="p-4 rounded-lg bg-[var(--secondary)] border border-[var(--border)] text-sm text-[var(--muted-foreground)]">
            No active subscriptions. Create one above to start receiving email
            notifications.
          </div>
        ) : (
          <div className="space-y-2">
            {subscriptions.map((sub) => (
              <div
                key={sub.id}
                className="flex items-center gap-3 p-3 rounded-lg bg-[var(--secondary)] border border-[var(--border)]"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <code className="text-xs text-[var(--foreground)] font-mono truncate">
                      {sub.subscriptionId}
                    </code>
                    {isExpired(sub.expirationDateTime) && (
                      <span className="shrink-0 px-1.5 py-0.5 text-[10px] font-semibold rounded bg-red-500/10 text-red-600 uppercase">
                        Expired
                      </span>
                    )}
                    {getCredentialLabel(sub.credentialId) && (
                      <span className="shrink-0 px-1.5 py-0.5 text-[10px] font-medium rounded bg-blue-500/10 text-blue-600">
                        {getCredentialLabel(sub.credentialId)}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[var(--muted-foreground)] mt-1">
                    {sub.resource} &middot; {sub.changeType} &middot; Expires{" "}
                    {new Date(sub.expirationDateTime).toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(sub.subscriptionId)}
                  className="shrink-0 px-3 py-1.5 text-xs font-medium rounded-md border border-red-500/30 text-red-600 hover:bg-red-500/10 transition-colors"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface WatchStatus {
  active: boolean;
  watch: {
    id: string;
    emailAddress: string;
    historyId: string | null;
    expiration: string | null;
    topicName: string;
    createdAt: string;
    updatedAt: string;
  } | null;
}

function GmailWatchManager() {
  const [status, setStatus] = useState<WatchStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Setup form state
  const [showSetup, setShowSetup] = useState(false);
  const [setupForm, setSetupForm] = useState({
    emailAddress: "",
    topicName: "",
    accessToken: "",
    refreshToken: "",
  });

  const fetchStatus = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/gmail/watch");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setStatus(data);
    } catch {
      setError("Failed to load watch status");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const handleSetup = async () => {
    if (!setupForm.emailAddress || !setupForm.topicName || !setupForm.accessToken || !setupForm.refreshToken) {
      setError("All fields are required");
      return;
    }
    setActionLoading("setup");
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch("/api/gmail/watch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(setupForm),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.details || data.error || "Setup failed");
      }
      setSuccess("Gmail watch created successfully");
      setShowSetup(false);
      setSetupForm({ emailAddress: "", topicName: "", accessToken: "", refreshToken: "" });
      setTimeout(() => setSuccess(null), 5000);
      await fetchStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to set up watch");
    } finally {
      setActionLoading(null);
    }
  };

  const handleRenew = async () => {
    setActionLoading("renew");
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch("/api/gmail/watch", { method: "PUT" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.details || data.error || "Renewal failed");
      }
      setSuccess("Gmail watch renewed successfully");
      setTimeout(() => setSuccess(null), 5000);
      await fetchStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to renew watch");
    } finally {
      setActionLoading(null);
    }
  };

  const handleStop = async () => {
    setActionLoading("stop");
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch("/api/gmail/watch", { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.details || data.error || "Stop failed");
      }
      setSuccess("Gmail watch stopped");
      setTimeout(() => setSuccess(null), 5000);
      await fetchStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to stop watch");
    } finally {
      setActionLoading(null);
    }
  };

  const isExpiringSoon = status?.watch?.expiration
    ? new Date(status.watch.expiration).getTime() - Date.now() < 24 * 60 * 60 * 1000
    : false;

  const isExpired = status?.watch?.expiration
    ? new Date(status.watch.expiration).getTime() < Date.now()
    : false;

  return (
    <div>
      <h3 className="text-sm font-semibold text-[var(--foreground)] mb-2">
        Gmail Watch Status
      </h3>
      <p className="text-sm text-[var(--muted-foreground)] mb-3">
        The Gmail Watch monitors your inbox via Pub/Sub and automatically
        fetches new emails. Watch subscriptions expire after 7 days and must
        be renewed.
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
      ) : status?.active && status.watch ? (
        <div className="space-y-4">
          {/* Active watch display */}
          <div className="p-4 rounded-lg border border-[var(--border)] bg-[var(--secondary)]">
            <div className="flex items-center gap-2 mb-3">
              <div className={`w-2.5 h-2.5 rounded-full ${isExpired ? "bg-red-500" : isExpiringSoon ? "bg-amber-500" : "bg-green-500"}`} />
              <span className="text-sm font-medium text-[var(--foreground)]">
                {isExpired ? "Watch Expired" : isExpiringSoon ? "Watch Expiring Soon" : "Watch Active"}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">
                  Email
                </span>
                <p className="text-[var(--foreground)] mt-0.5">{status.watch.emailAddress}</p>
              </div>
              <div>
                <span className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">
                  Topic
                </span>
                <p className="text-[var(--foreground)] mt-0.5 break-all">{status.watch.topicName}</p>
              </div>
              <div>
                <span className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">
                  History ID
                </span>
                <p className="text-[var(--foreground)] mt-0.5 font-mono">{status.watch.historyId ?? "—"}</p>
              </div>
              <div>
                <span className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">
                  Expires
                </span>
                <p className={`mt-0.5 ${isExpired ? "text-red-600 font-medium" : isExpiringSoon ? "text-amber-600 font-medium" : "text-[var(--foreground)]"}`}>
                  {status.watch.expiration
                    ? new Date(status.watch.expiration).toLocaleString()
                    : "—"}
                </p>
              </div>
            </div>
          </div>

          {(isExpiringSoon || isExpired) && (
            <div className={`p-3 rounded-lg text-sm ${isExpired ? "bg-red-500/10 border border-red-500/20 text-red-600" : "bg-amber-500/10 border border-amber-500/20 text-amber-700"}`}>
              {isExpired
                ? "Your watch subscription has expired. Pub/Sub notifications are no longer being delivered. Renew now to resume email ingestion."
                : "Your watch subscription expires within 24 hours. Renew it to prevent interruption."}
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={handleRenew}
              disabled={actionLoading !== null}
              className="px-4 py-2 text-sm font-medium rounded-md bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {actionLoading === "renew" ? "Renewing..." : "Renew Watch"}
            </button>
            <button
              onClick={handleStop}
              disabled={actionLoading !== null}
              className="px-4 py-2 text-sm font-medium rounded-md border border-red-500/30 text-red-600 hover:bg-red-500/10 transition-colors disabled:opacity-50"
            >
              {actionLoading === "stop" ? "Stopping..." : "Stop Watch"}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="p-4 rounded-lg border border-[var(--border)] bg-[var(--secondary)]">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2.5 h-2.5 rounded-full bg-gray-400" />
              <span className="text-sm font-medium text-[var(--muted-foreground)]">
                No Active Watch
              </span>
            </div>
            <p className="text-sm text-[var(--muted-foreground)]">
              Set up a Gmail watch to start receiving real-time email
              notifications via Pub/Sub. You&apos;ll need OAuth tokens from
              a Google Cloud project with the Gmail API enabled.
            </p>
          </div>

          {!showSetup ? (
            <button
              onClick={() => setShowSetup(true)}
              className="px-4 py-2 text-sm font-medium rounded-md bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 transition-opacity"
            >
              Set Up Gmail Watch
            </button>
          ) : (
            <div className="space-y-3 p-4 rounded-lg border border-[var(--border)] bg-[var(--card)]">
              <h4 className="text-sm font-semibold text-[var(--foreground)]">
                Configure Gmail Watch
              </h4>
              <p className="text-xs text-[var(--muted-foreground)]">
                Provide your Gmail address, Google Cloud Pub/Sub topic name, and
                OAuth tokens obtained from the Google OAuth consent flow with the{" "}
                <code className="px-1 py-0.5 rounded bg-[var(--secondary)] text-xs">gmail.readonly</code>{" "}
                scope.
              </p>
              <div>
                <label className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">
                  Gmail Address
                </label>
                <input
                  type="email"
                  value={setupForm.emailAddress}
                  onChange={(e) => setSetupForm({ ...setupForm, emailAddress: e.target.value })}
                  placeholder="user@gmail.com"
                  className="mt-1 w-full px-3 py-2 text-sm rounded-md border border-[var(--border)] bg-[var(--secondary)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">
                  Pub/Sub Topic Name
                </label>
                <input
                  type="text"
                  value={setupForm.topicName}
                  onChange={(e) => setSetupForm({ ...setupForm, topicName: e.target.value })}
                  placeholder="projects/my-project/topics/gmail-inbound"
                  className="mt-1 w-full px-3 py-2 text-sm rounded-md border border-[var(--border)] bg-[var(--secondary)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">
                  Access Token
                </label>
                <input
                  type="password"
                  value={setupForm.accessToken}
                  onChange={(e) => setSetupForm({ ...setupForm, accessToken: e.target.value })}
                  placeholder="ya29.a0..."
                  className="mt-1 w-full px-3 py-2 text-sm rounded-md border border-[var(--border)] bg-[var(--secondary)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">
                  Refresh Token
                </label>
                <input
                  type="password"
                  value={setupForm.refreshToken}
                  onChange={(e) => setSetupForm({ ...setupForm, refreshToken: e.target.value })}
                  placeholder="1//0e..."
                  className="mt-1 w-full px-3 py-2 text-sm rounded-md border border-[var(--border)] bg-[var(--secondary)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                />
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={handleSetup}
                  disabled={actionLoading !== null}
                  className="px-4 py-2 text-sm font-medium rounded-md bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {actionLoading === "setup" ? "Creating..." : "Create Watch"}
                </button>
                <button
                  onClick={() => setShowSetup(false)}
                  className="px-4 py-2 text-sm font-medium rounded-md border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--accent)] transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ZoomIntegrationManager() {
  const [status, setStatus] = useState<{
    connected: boolean;
    zoomAccountId?: string;
    tokenExpiry?: string;
    isExpired?: boolean;
    createdAt?: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/zoom/oauth");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setStatus(data);
    } catch {
      setError("Failed to load Zoom connection status");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // Check for OAuth callback result in URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("zoom_connected") === "true") {
      setSuccess("Zoom connected successfully!");
      setTimeout(() => setSuccess(null), 5000);
      fetchStatus();
      // Clean up URL
      const url = new URL(window.location.href);
      url.searchParams.delete("zoom_connected");
      window.history.replaceState({}, "", url.toString());
    }
    if (params.get("zoom_error")) {
      setError(`Zoom connection failed: ${params.get("zoom_error")}`);
      const url = new URL(window.location.href);
      url.searchParams.delete("zoom_error");
      window.history.replaceState({}, "", url.toString());
    }
  }, [fetchStatus]);

  const handleConnect = () => {
    const clientId = process.env.NEXT_PUBLIC_ZOOM_CLIENT_ID;
    if (!clientId) {
      setError("NEXT_PUBLIC_ZOOM_CLIENT_ID is not configured");
      return;
    }
    const redirectUri = `${window.location.origin}/api/zoom/oauth/callback`;
    const authUrl = `https://zoom.us/oauth/authorize?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}`;
    window.location.href = authUrl;
  };

  const handleDisconnect = async () => {
    setActionLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch("/api/zoom/oauth", { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to disconnect");
      setSuccess("Zoom disconnected");
      setTimeout(() => setSuccess(null), 5000);
      await fetchStatus();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to disconnect Zoom"
      );
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div>
      <h3 className="text-sm font-semibold text-[var(--foreground)] mb-2">
        Connection Status
      </h3>
      <p className="text-sm text-[var(--muted-foreground)] mb-3">
        Connect your Zoom account to start capturing chat messages in real-time
        via Zoom webhooks.
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
      ) : status?.connected ? (
        <div className="space-y-4">
          <div className="p-4 rounded-lg border border-[var(--border)] bg-[var(--secondary)]">
            <div className="flex items-center gap-2 mb-3">
              <div
                className={`w-2.5 h-2.5 rounded-full ${
                  status.isExpired ? "bg-amber-500" : "bg-green-500"
                }`}
              />
              <span className="text-sm font-medium text-[var(--foreground)]">
                {status.isExpired
                  ? "Token Expired (will auto-refresh)"
                  : "Connected"}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {status.zoomAccountId && (
                <div>
                  <span className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">
                    Account ID
                  </span>
                  <p className="text-[var(--foreground)] mt-0.5 font-mono text-xs">
                    {status.zoomAccountId}
                  </p>
                </div>
              )}
              <div>
                <span className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">
                  Connected Since
                </span>
                <p className="text-[var(--foreground)] mt-0.5">
                  {status.createdAt
                    ? new Date(status.createdAt).toLocaleString()
                    : "—"}
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={handleDisconnect}
            disabled={actionLoading}
            className="px-4 py-2 text-sm font-medium rounded-md border border-red-500/30 text-red-600 hover:bg-red-500/10 transition-colors disabled:opacity-50"
          >
            {actionLoading ? "Disconnecting..." : "Disconnect Zoom"}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="p-4 rounded-lg border border-[var(--border)] bg-[var(--secondary)]">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2.5 h-2.5 rounded-full bg-gray-400" />
              <span className="text-sm font-medium text-[var(--muted-foreground)]">
                Not Connected
              </span>
            </div>
            <p className="text-sm text-[var(--muted-foreground)]">
              Connect your Zoom account to start ingesting chat messages. You
              will be redirected to Zoom to authorize the app.
            </p>
          </div>

          <button
            onClick={handleConnect}
            className="px-4 py-2 text-sm font-medium rounded-md bg-[#2D8CFF] text-white hover:bg-[#2681eb] transition-colors"
          >
            Connect Zoom Account
          </button>
        </div>
      )}
    </div>
  );
}

interface BoardOption {
  id: string;
  title: string;
}

function DefaultBoardSelector() {
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

function OutlookIntegrationManager() {
  const [status, setStatus] = useState<{
    connected: boolean;
    outlookEmail?: string;
    tokenExpiry?: string;
    isExpired?: boolean;
    lastSyncAt?: string | null;
    createdAt?: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [syncResult, setSyncResult] = useState<{
    total: number;
    inserted: number;
    skipped: number;
  } | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/outlook/oauth");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setStatus(data);
    } catch {
      setError("Failed to load Outlook connection status");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // Check for OAuth callback result in URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("outlook_connected") === "true") {
      setSuccess("Outlook connected successfully!");
      setTimeout(() => setSuccess(null), 5000);
      fetchStatus();
      const url = new URL(window.location.href);
      url.searchParams.delete("outlook_connected");
      window.history.replaceState({}, "", url.toString());
    }
    if (params.get("outlook_error")) {
      setError(`Outlook connection failed: ${params.get("outlook_error")}`);
      const url = new URL(window.location.href);
      url.searchParams.delete("outlook_error");
      window.history.replaceState({}, "", url.toString());
    }
  }, [fetchStatus]);

  const handleConnect = () => {
    window.location.href = "/api/outlook/oauth?action=connect";
  };

  const handleDisconnect = async () => {
    setActionLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch("/api/outlook/oauth", { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to disconnect");
      setSuccess("Outlook disconnected");
      setTimeout(() => setSuccess(null), 5000);
      await fetchStatus();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to disconnect Outlook"
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    setError(null);
    setSyncResult(null);
    try {
      const res = await fetch("/api/outlook/sync", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Sync failed");
      setSyncResult({ total: data.total, inserted: data.inserted, skipped: data.skipped });
      setSuccess(`Sync complete: ${data.inserted} new emails imported`);
      setTimeout(() => setSuccess(null), 5000);
      await fetchStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sync failed");
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div>
      <h3 className="text-sm font-semibold text-[var(--foreground)] mb-2">
        Connection Status
      </h3>
      <p className="text-sm text-[var(--muted-foreground)] mb-3">
        Connect your personal Microsoft account (Outlook.com, Hotmail, Live) to
        read emails using delegated OAuth permissions.
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
      ) : status?.connected ? (
        <div className="space-y-4">
          <div className="p-4 rounded-lg border border-[var(--border)] bg-[var(--secondary)]">
            <div className="flex items-center gap-2 mb-3">
              <div
                className={`w-2.5 h-2.5 rounded-full ${
                  status.isExpired ? "bg-amber-500" : "bg-green-500"
                }`}
              />
              <span className="text-sm font-medium text-[var(--foreground)]">
                {status.isExpired
                  ? "Token Expired (will auto-refresh)"
                  : "Connected"}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">
                  Email
                </span>
                <p className="text-[var(--foreground)] mt-0.5">
                  {status.outlookEmail}
                </p>
              </div>
              <div>
                <span className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">
                  Connected Since
                </span>
                <p className="text-[var(--foreground)] mt-0.5">
                  {status.createdAt
                    ? new Date(status.createdAt).toLocaleString()
                    : "—"}
                </p>
              </div>
              <div>
                <span className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">
                  Last Sync
                </span>
                <p className="text-[var(--foreground)] mt-0.5">
                  {status.lastSyncAt
                    ? new Date(status.lastSyncAt).toLocaleString()
                    : "Never"}
                </p>
              </div>
            </div>
          </div>

          {syncResult && (
            <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-sm text-[var(--foreground)]">
              Fetched {syncResult.total} messages: {syncResult.inserted} new, {syncResult.skipped} already existed.
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={handleSync}
              disabled={syncing}
              className="px-4 py-2 text-sm font-medium rounded-md bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {syncing ? "Syncing..." : "Sync Emails Now"}
            </button>
            <button
              onClick={handleDisconnect}
              disabled={actionLoading}
              className="px-4 py-2 text-sm font-medium rounded-md border border-red-500/30 text-red-600 hover:bg-red-500/10 transition-colors disabled:opacity-50"
            >
              {actionLoading ? "Disconnecting..." : "Disconnect"}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="p-4 rounded-lg border border-[var(--border)] bg-[var(--secondary)]">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2.5 h-2.5 rounded-full bg-gray-400" />
              <span className="text-sm font-medium text-[var(--muted-foreground)]">
                Not Connected
              </span>
            </div>
            <p className="text-sm text-[var(--muted-foreground)]">
              Connect your Outlook.com account to start importing emails. You
              will be redirected to Microsoft to authorize the app.
            </p>
          </div>

          <button
            onClick={handleConnect}
            className="px-4 py-2 text-sm font-medium rounded-md bg-[#0078D4] text-white hover:bg-[#106ebe] transition-colors"
          >
            Connect Outlook Account
          </button>
        </div>
      )}
    </div>
  );
}

export function IntegrationsClient({ tenantId }: { tenantId: string }) {
  const [activeTab, setActiveTab] = useState<TabId>("microsoft365");
  const [graphCredentials, setGraphCredentials] = useState<GraphCredential[]>([]);
  const origin = typeof window !== "undefined" ? window.location.origin : "https://your-domain.com";
  const webhookUrl = `${origin}/api/webhooks/email/microsoft365/${tenantId}`;
  const graphWebhookUrl = `${origin}/api/webhooks/email/graph/${tenantId}`;
  const gmailWebhookUrl = `${origin}/api/webhooks/email/gmail/${tenantId}`;
  const zoomWebhookUrl = `${origin}/api/webhooks/zoom`;
  const crispWebhookUrl = `${origin}/api/webhooks/key-points?user_id=${tenantId}`;

  return (
    <div className="flex h-full flex-col bg-[var(--background)]">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--background)]/80 backdrop-blur-md">
        <div className="px-6 py-4">
          <div>
            <h1 className="text-2xl font-bold text-[var(--foreground)]">
              Integrations
            </h1>
            <p className="text-sm text-[var(--muted-foreground)] mt-1">
              Connect external services to ingest data automatically
            </p>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-4" role="tablist">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                role="tab"
                aria-selected={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? "bg-[var(--primary)]/10 text-[var(--primary)]"
                    : "text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--accent)]"
                }`}
              >
                <span style={{ color: activeTab === tab.id ? tab.color : undefined }}>
                  {tab.icon}
                </span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-auto px-6 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Microsoft 365 Section */}
          {activeTab === "microsoft365" && <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
            <div className="px-6 py-5 border-b border-[var(--border)]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#0078D4] flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                    <path d="M11.5 3v8.5H3V3h8.5zm0 18H3v-8.5h8.5V21zm1-18H21v8.5h-8.5V3zm0 18v-8.5H21V21h-8.5z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-[var(--foreground)]">
                    Microsoft 365 / Exchange Email
                  </h2>
                  <p className="text-sm text-[var(--muted-foreground)]">
                    Ingest emails via Power Automate webhooks
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-8">
              {/* Webhook URL */}
              <div>
                <h3 className="text-sm font-semibold text-[var(--foreground)] mb-2">
                  Your Webhook URL
                </h3>
                <p className="text-sm text-[var(--muted-foreground)] mb-3">
                  This is your tenant-specific endpoint. Use it as the HTTP POST
                  target in Power Automate.
                </p>
                <div className="flex items-center p-3 rounded-lg bg-[var(--secondary)] border border-[var(--border)]">
                  <code className="flex-1 text-sm text-[var(--foreground)] break-all">
                    {webhookUrl}
                  </code>
                  <CopyButton text={webhookUrl} />
                </div>
              </div>

              {/* API Key Info */}
              <div>
                <h3 className="text-sm font-semibold text-[var(--foreground)] mb-2">
                  Authentication
                </h3>
                <p className="text-sm text-[var(--muted-foreground)] mb-3">
                  All requests must include an <code className="px-1.5 py-0.5 rounded bg-[var(--secondary)] text-[var(--foreground)] text-xs">X-API-Key</code> header
                  with the value of your <code className="px-1.5 py-0.5 rounded bg-[var(--secondary)] text-[var(--foreground)] text-xs">EMAIL_WEBHOOK_SECRET</code> environment
                  variable configured on the server.
                </p>
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-sm text-[var(--foreground)]">
                  Contact your server administrator for the API key value. It is
                  defined as the <code className="font-mono">EMAIL_WEBHOOK_SECRET</code> environment
                  variable.
                </div>
              </div>

              {/* Setup Steps */}
              <div>
                <h3 className="text-sm font-semibold text-[var(--foreground)] mb-4">
                  Power Automate Setup Guide
                </h3>

                <ol className="space-y-6">
                  {/* Step 1 */}
                  <li className="flex gap-4">
                    <span className="flex-shrink-0 w-7 h-7 rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] flex items-center justify-center text-sm font-semibold">
                      1
                    </span>
                    <div className="flex-1">
                      <p className="font-medium text-[var(--foreground)]">
                        Create a new Automated Cloud Flow
                      </p>
                      <p className="text-sm text-[var(--muted-foreground)] mt-1">
                        Go to{" "}
                        <span className="font-medium text-[var(--foreground)]">Power Automate</span>{" "}
                        &rarr; <span className="font-medium text-[var(--foreground)]">Create</span>{" "}
                        &rarr; <span className="font-medium text-[var(--foreground)]">Automated cloud flow</span>.
                        Name your flow (e.g., &quot;Email to Webhook&quot;).
                      </p>
                    </div>
                  </li>

                  {/* Step 2 */}
                  <li className="flex gap-4">
                    <span className="flex-shrink-0 w-7 h-7 rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] flex items-center justify-center text-sm font-semibold">
                      2
                    </span>
                    <div className="flex-1">
                      <p className="font-medium text-[var(--foreground)]">
                        Add Trigger: &quot;When a new email arrives (V3)&quot;
                      </p>
                      <p className="text-sm text-[var(--muted-foreground)] mt-1">
                        Search for the <span className="font-medium text-[var(--foreground)]">Office 365 Outlook</span> connector
                        and select the <span className="font-medium text-[var(--foreground)]">&quot;When a new email arrives (V3)&quot;</span> trigger.
                        Configure your desired folder (e.g., Inbox) and any filters.
                      </p>
                    </div>
                  </li>

                  {/* Step 3 */}
                  <li className="flex gap-4">
                    <span className="flex-shrink-0 w-7 h-7 rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] flex items-center justify-center text-sm font-semibold">
                      3
                    </span>
                    <div className="flex-1">
                      <p className="font-medium text-[var(--foreground)]">
                        Add Action: HTTP POST
                      </p>
                      <p className="text-sm text-[var(--muted-foreground)] mt-1">
                        Add a new step and search for <span className="font-medium text-[var(--foreground)]">&quot;HTTP&quot;</span>.
                        Select the <span className="font-medium text-[var(--foreground)]">HTTP</span> action (premium connector) and configure:
                      </p>
                      <div className="mt-3 space-y-3">
                        <div>
                          <span className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">Method</span>
                          <p className="text-sm text-[var(--foreground)] font-mono">POST</p>
                        </div>
                        <div>
                          <span className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">URI</span>
                          <div className="flex items-center mt-1 p-2 rounded bg-[var(--secondary)] border border-[var(--border)]">
                            <code className="text-sm text-[var(--foreground)] break-all">{webhookUrl}</code>
                          </div>
                        </div>
                        <div>
                          <span className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">Headers</span>
                          <CodeBlock>{`Content-Type: application/json\nX-API-Key: <your-api-key>`}</CodeBlock>
                        </div>
                      </div>
                    </div>
                  </li>

                  {/* Step 4 */}
                  <li className="flex gap-4">
                    <span className="flex-shrink-0 w-7 h-7 rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] flex items-center justify-center text-sm font-semibold">
                      4
                    </span>
                    <div className="flex-1">
                      <p className="font-medium text-[var(--foreground)]">
                        Configure the Request Body
                      </p>
                      <p className="text-sm text-[var(--muted-foreground)] mt-1">
                        In the Body field, switch to the expression/code view and
                        paste the following JSON, mapping Power Automate dynamic
                        content fields:
                      </p>
                      <div className="mt-3">
                        <CodeBlock>{`{
  "messageId": "@{triggerOutputs()?['body/id']}",
  "from": "@{triggerOutputs()?['body/from']}",
  "to": @{triggerOutputs()?['body/toRecipients']},
  "cc": @{triggerOutputs()?['body/ccRecipients']},
  "subject": "@{triggerOutputs()?['body/subject']}",
  "bodyPlainText": "@{triggerOutputs()?['body/bodyPreview']}",
  "bodyHtml": "@{triggerOutputs()?['body/body']}",
  "receivedDateTime": "@{triggerOutputs()?['body/receivedDateTime']}"
}`}</CodeBlock>
                      </div>
                      <p className="text-sm text-[var(--muted-foreground)] mt-3">
                        Adjust the dynamic content expressions to match your
                        Power Automate trigger output. The exact field names may
                        vary by connector version.
                      </p>
                    </div>
                  </li>

                  {/* Step 5 */}
                  <li className="flex gap-4">
                    <span className="flex-shrink-0 w-7 h-7 rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] flex items-center justify-center text-sm font-semibold">
                      5
                    </span>
                    <div className="flex-1">
                      <p className="font-medium text-[var(--foreground)]">
                        Save and Test
                      </p>
                      <p className="text-sm text-[var(--muted-foreground)] mt-1">
                        Save your flow and send a test email to the monitored
                        mailbox. Check the flow run history to verify it
                        completes with a <code className="px-1.5 py-0.5 rounded bg-[var(--secondary)] text-[var(--foreground)] text-xs">201</code> response.
                      </p>
                    </div>
                  </li>
                </ol>
              </div>

              {/* Field Mapping Reference */}
              <div>
                <h3 className="text-sm font-semibold text-[var(--foreground)] mb-3">
                  Field Mapping Reference
                </h3>
                <div className="overflow-x-auto rounded-lg border border-[var(--border)]">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-[var(--secondary)]">
                        <th className="px-4 py-3 text-left font-medium text-[var(--foreground)]">
                          Power Automate Field
                        </th>
                        <th className="px-4 py-3 text-left font-medium text-[var(--foreground)]">
                          Webhook Payload Key
                        </th>
                        <th className="px-4 py-3 text-left font-medium text-[var(--foreground)]">
                          Description
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)]">
                      {FIELD_MAPPING.map((field) => (
                        <tr key={field.payload}>
                          <td className="px-4 py-3 text-[var(--foreground)]">
                            {field.powerAutomate}
                          </td>
                          <td className="px-4 py-3">
                            <code className="px-1.5 py-0.5 rounded bg-[var(--secondary)] text-[var(--foreground)] text-xs">
                              {field.payload}
                            </code>
                          </td>
                          <td className="px-4 py-3 text-[var(--muted-foreground)]">
                            {field.description}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Response Codes */}
              <div>
                <h3 className="text-sm font-semibold text-[var(--foreground)] mb-3">
                  Response Codes
                </h3>
                <div className="overflow-x-auto rounded-lg border border-[var(--border)]">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-[var(--secondary)]">
                        <th className="px-4 py-3 text-left font-medium text-[var(--foreground)]">
                          Code
                        </th>
                        <th className="px-4 py-3 text-left font-medium text-[var(--foreground)]">
                          Meaning
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)]">
                      <tr>
                        <td className="px-4 py-3">
                          <code className="px-1.5 py-0.5 rounded bg-green-500/10 text-green-600 text-xs font-semibold">
                            200
                          </code>
                        </td>
                        <td className="px-4 py-3 text-[var(--muted-foreground)]">
                          Duplicate email &mdash; already processed (safe to ignore)
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3">
                          <code className="px-1.5 py-0.5 rounded bg-green-500/10 text-green-600 text-xs font-semibold">
                            201
                          </code>
                        </td>
                        <td className="px-4 py-3 text-[var(--muted-foreground)]">
                          Email received and stored successfully
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3">
                          <code className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 text-xs font-semibold">
                            400
                          </code>
                        </td>
                        <td className="px-4 py-3 text-[var(--muted-foreground)]">
                          Validation error &mdash; check payload structure
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3">
                          <code className="px-1.5 py-0.5 rounded bg-red-500/10 text-red-600 text-xs font-semibold">
                            401
                          </code>
                        </td>
                        <td className="px-4 py-3 text-[var(--muted-foreground)]">
                          Unauthorized &mdash; invalid or missing API key
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3">
                          <code className="px-1.5 py-0.5 rounded bg-red-500/10 text-red-600 text-xs font-semibold">
                            404
                          </code>
                        </td>
                        <td className="px-4 py-3 text-[var(--muted-foreground)]">
                          Tenant not found
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3">
                          <code className="px-1.5 py-0.5 rounded bg-red-500/10 text-red-600 text-xs font-semibold">
                            500
                          </code>
                        </td>
                        <td className="px-4 py-3 text-[var(--muted-foreground)]">
                          Internal server error &mdash; retry after a delay
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </section>}

          {/* Microsoft Graph API Section */}
          {activeTab === "graph" && <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
            <div className="px-6 py-5 border-b border-[var(--border)]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#0078D4] flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                    <path d="M21.17 3.25q.33 0 .59.25.24.25.24.58 0 .34-.24.59l-7.83 7.83L15 15.58l-1.41-1.41 1.07-1.08-7.83-7.83a.81.81 0 0 1-.25-.59q0-.33.25-.58.26-.25.59-.25.33 0 .58.25l7 7 7-7q.25-.25.58-.25zM3.83 19q0-.41.29-.71.3-.29.71-.29h14.34q.41 0 .71.29.29.3.29.71 0 .41-.29.71-.3.29-.71.29H4.83q-.41 0-.71-.29Q3.83 19.41 3.83 19z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-[var(--foreground)]">
                    Microsoft Graph API
                  </h2>
                  <p className="text-sm text-[var(--muted-foreground)]">
                    Ingest emails via Graph change notifications (webhooks)
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-8">
              {/* Description */}
              <div>
                <p className="text-sm text-[var(--muted-foreground)]">
                  Microsoft Graph change notifications push real-time updates to your
                  webhook when new emails arrive in a mailbox. This uses the Graph API
                  directly with app-only (client credentials) authentication. Subscriptions
                  expire after 3 days and must be renewed.
                </p>
              </div>

              {/* Azure Portal Requirements */}
              <div className="p-5 rounded-lg border-2 border-blue-500/30 bg-blue-500/5 space-y-4">
                <div className="flex items-center gap-2">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 16v-4" />
                    <path d="M12 8h.01" />
                  </svg>
                  <h3 className="text-sm font-semibold text-[var(--foreground)]">
                    Azure Portal Setup Required
                  </h3>
                </div>
                <p className="text-sm text-[var(--muted-foreground)]">
                  Before connecting, you need to create an app registration in Azure Portal.
                  Complete these steps first &mdash; you&apos;ll need the three values highlighted below.
                </p>

                <ol className="space-y-4 text-sm">
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500/20 text-blue-600 flex items-center justify-center text-xs font-bold">1</span>
                    <div>
                      <p className="text-[var(--foreground)] font-medium">Create an App Registration</p>
                      <p className="text-[var(--muted-foreground)] mt-0.5">
                        Azure Portal &rarr; Microsoft Entra ID &rarr; App registrations &rarr; New registration.
                        Name it anything (e.g., &quot;Krisp Email Ingestion&quot;). No redirect URI needed.
                      </p>
                      <div className="mt-2 p-2.5 rounded-md bg-[var(--secondary)] border border-[var(--border)]">
                        <p className="text-xs text-[var(--muted-foreground)]">
                          Copy the <span className="font-semibold text-[var(--foreground)]">Application (client) ID</span> and{" "}
                          <span className="font-semibold text-[var(--foreground)]">Directory (tenant) ID</span> from the app&apos;s Overview page.
                        </p>
                      </div>
                    </div>
                  </li>

                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500/20 text-blue-600 flex items-center justify-center text-xs font-bold">2</span>
                    <div>
                      <p className="text-[var(--foreground)] font-medium">Add API Permissions</p>
                      <p className="text-[var(--muted-foreground)] mt-0.5">
                        In your app &rarr; API permissions &rarr; Add a permission &rarr; Microsoft Graph &rarr;{" "}
                        <span className="font-semibold text-[var(--foreground)]">Application permissions</span> (not Delegated).
                      </p>
                      <div className="mt-2 p-2.5 rounded-md bg-amber-500/10 border border-amber-500/20">
                        <p className="text-xs text-amber-700">
                          Add <code className="px-1 py-0.5 rounded bg-[var(--secondary)] text-[var(--foreground)] font-semibold">Mail.Read</code> then
                          click <span className="font-semibold">&quot;Grant admin consent&quot;</span> &mdash; the green checkmark button at the top.
                          Without admin consent, subscriptions will fail with &quot;Access denied.&quot;
                        </p>
                      </div>
                    </div>
                  </li>

                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500/20 text-blue-600 flex items-center justify-center text-xs font-bold">3</span>
                    <div>
                      <p className="text-[var(--foreground)] font-medium">Create a Client Secret</p>
                      <p className="text-[var(--muted-foreground)] mt-0.5">
                        In your app &rarr; Certificates &amp; secrets &rarr; New client secret. Copy the{" "}
                        <span className="font-semibold text-[var(--foreground)]">Value</span> immediately (it&apos;s only shown once).
                      </p>
                    </div>
                  </li>
                </ol>

                <div className="pt-2 border-t border-blue-500/20">
                  <p className="text-xs text-[var(--muted-foreground)]">
                    You should now have three values: <span className="font-medium text-[var(--foreground)]">Directory (tenant) ID</span>,{" "}
                    <span className="font-medium text-[var(--foreground)]">Application (client) ID</span>, and{" "}
                    <span className="font-medium text-[var(--foreground)]">Client secret value</span>. Enter them below.
                  </p>
                </div>
              </div>

              {/* Setup Steps */}
              <div>
                <h3 className="text-sm font-semibold text-[var(--foreground)] mb-4">
                  Connect &amp; Subscribe
                </h3>

                <ol className="space-y-6">

                  {/* Step 1: Connect */}
                  <li className="flex gap-4">
                    <span className="flex-shrink-0 w-7 h-7 rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] flex items-center justify-center text-sm font-semibold">
                      1
                    </span>
                    <div className="flex-1">
                      <p className="font-medium text-[var(--foreground)]">
                        Enter Your Credentials
                      </p>
                      <p className="text-sm text-[var(--muted-foreground)] mt-1 mb-4">
                        Paste the three values from your Azure app registration. These are stored
                        securely and used to obtain access tokens automatically.
                      </p>
                      <GraphCredentialsManager onCredentialsChange={setGraphCredentials} />
                    </div>
                  </li>

                  {/* Step 2: Create subscription */}
                  <li className="flex gap-4">
                    <span className="flex-shrink-0 w-7 h-7 rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] flex items-center justify-center text-sm font-semibold">
                      2
                    </span>
                    <div className="flex-1">
                      <p className="font-medium text-[var(--foreground)]">
                        Create a Mail Subscription
                      </p>
                      <p className="text-sm text-[var(--muted-foreground)] mt-1 mb-4">
                        Enter the Microsoft 365 email address to monitor. A Graph change notification
                        subscription will be created to push new emails to your webhook in real time.
                        Subscriptions expire after ~3 days and need to be renewed.
                      </p>
                      <GraphSubscriptionManager graphWebhookUrl={graphWebhookUrl} credentials={graphCredentials} />
                    </div>
                  </li>

                  {/* Step 3 */}
                  <li className="flex gap-4">
                    <span className="flex-shrink-0 w-7 h-7 rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] flex items-center justify-center text-sm font-semibold">
                      3
                    </span>
                    <div className="flex-1">
                      <p className="font-medium text-[var(--foreground)]">
                        Test the Integration
                      </p>
                      <p className="text-sm text-[var(--muted-foreground)] mt-1">
                        Send a test email to the monitored mailbox. Within seconds, Microsoft Graph
                        should POST a change notification to your webhook. Check server logs for the{" "}
                        <code className="px-1.5 py-0.5 rounded bg-[var(--secondary)] text-[var(--foreground)] text-xs">[Graph]</code> log
                        entries confirming receipt.
                      </p>
                    </div>
                  </li>
                </ol>
              </div>

              {/* Subscription Lifecycle */}
              <div>
                <h3 className="text-sm font-semibold text-[var(--foreground)] mb-3">
                  Subscription Lifecycle
                </h3>
                <div className="overflow-x-auto rounded-lg border border-[var(--border)]">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-[var(--secondary)]">
                        <th className="px-4 py-3 text-left font-medium text-[var(--foreground)]">
                          Phase
                        </th>
                        <th className="px-4 py-3 text-left font-medium text-[var(--foreground)]">
                          What Happens
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)]">
                      <tr>
                        <td className="px-4 py-3 font-medium text-[var(--foreground)]">
                          Create
                        </td>
                        <td className="px-4 py-3 text-[var(--muted-foreground)]">
                          POST to <code className="text-xs">/v1.0/subscriptions</code> &mdash; Microsoft sends
                          a GET with <code className="text-xs">validationToken</code> to your endpoint
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 font-medium text-[var(--foreground)]">
                          Validate
                        </td>
                        <td className="px-4 py-3 text-[var(--muted-foreground)]">
                          Your endpoint echoes the token back as <code className="text-xs">text/plain</code> within
                          10 seconds (handled automatically)
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 font-medium text-[var(--foreground)]">
                          Notify
                        </td>
                        <td className="px-4 py-3 text-[var(--muted-foreground)]">
                          On resource change, Microsoft POSTs a notification with <code className="text-xs">clientState</code>{" "}
                          for verification &mdash; your endpoint returns 202 within 3 seconds
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 font-medium text-[var(--foreground)]">
                          Renew
                        </td>
                        <td className="px-4 py-3 text-[var(--muted-foreground)]">
                          PATCH the subscription before expiration (max 3 days for mail) with a new{" "}
                          <code className="text-xs">expirationDateTime</code>
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 font-medium text-[var(--foreground)]">
                          Delete
                        </td>
                        <td className="px-4 py-3 text-[var(--muted-foreground)]">
                          DELETE <code className="text-xs">/v1.0/subscriptions/&#123;id&#125;</code> to stop
                          receiving notifications
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Notification Payload Reference */}
              <div>
                <h3 className="text-sm font-semibold text-[var(--foreground)] mb-3">
                  Notification Payload Reference
                </h3>
                <p className="text-sm text-[var(--muted-foreground)] mb-3">
                  Each POST from Microsoft contains a <code className="px-1.5 py-0.5 rounded bg-[var(--secondary)] text-[var(--foreground)] text-xs">value</code> array
                  with one or more notification objects:
                </p>
                <div className="overflow-x-auto rounded-lg border border-[var(--border)]">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-[var(--secondary)]">
                        <th className="px-4 py-3 text-left font-medium text-[var(--foreground)]">
                          Field
                        </th>
                        <th className="px-4 py-3 text-left font-medium text-[var(--foreground)]">
                          Description
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)]">
                      <tr>
                        <td className="px-4 py-3">
                          <code className="px-1.5 py-0.5 rounded bg-[var(--secondary)] text-[var(--foreground)] text-xs">
                            changeType
                          </code>
                        </td>
                        <td className="px-4 py-3 text-[var(--muted-foreground)]">
                          Type of change: &quot;created&quot;, &quot;updated&quot;, or &quot;deleted&quot;
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3">
                          <code className="px-1.5 py-0.5 rounded bg-[var(--secondary)] text-[var(--foreground)] text-xs">
                            clientState
                          </code>
                        </td>
                        <td className="px-4 py-3 text-[var(--muted-foreground)]">
                          The secret you set when creating the subscription &mdash; verify this matches
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3">
                          <code className="px-1.5 py-0.5 rounded bg-[var(--secondary)] text-[var(--foreground)] text-xs">
                            resource
                          </code>
                        </td>
                        <td className="px-4 py-3 text-[var(--muted-foreground)]">
                          The resource path (e.g., <code className="text-xs">me/messages/AAMk...</code>)
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3">
                          <code className="px-1.5 py-0.5 rounded bg-[var(--secondary)] text-[var(--foreground)] text-xs">
                            resourceData
                          </code>
                        </td>
                        <td className="px-4 py-3 text-[var(--muted-foreground)]">
                          Object with <code className="text-xs">id</code>, <code className="text-xs">@odata.type</code> &mdash; contains the message ID
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3">
                          <code className="px-1.5 py-0.5 rounded bg-[var(--secondary)] text-[var(--foreground)] text-xs">
                            subscriptionId
                          </code>
                        </td>
                        <td className="px-4 py-3 text-[var(--muted-foreground)]">
                          The ID of the subscription that triggered this notification
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3">
                          <code className="px-1.5 py-0.5 rounded bg-[var(--secondary)] text-[var(--foreground)] text-xs">
                            subscriptionExpirationDateTime
                          </code>
                        </td>
                        <td className="px-4 py-3 text-[var(--muted-foreground)]">
                          When the subscription expires (ISO 8601)
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Response Codes */}
              <div>
                <h3 className="text-sm font-semibold text-[var(--foreground)] mb-3">
                  Response Codes
                </h3>
                <div className="overflow-x-auto rounded-lg border border-[var(--border)]">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-[var(--secondary)]">
                        <th className="px-4 py-3 text-left font-medium text-[var(--foreground)]">
                          Code
                        </th>
                        <th className="px-4 py-3 text-left font-medium text-[var(--foreground)]">
                          Meaning
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)]">
                      <tr>
                        <td className="px-4 py-3">
                          <code className="px-1.5 py-0.5 rounded bg-green-500/10 text-green-600 text-xs font-semibold">
                            200
                          </code>
                        </td>
                        <td className="px-4 py-3 text-[var(--muted-foreground)]">
                          Validation handshake completed (GET with validationToken)
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3">
                          <code className="px-1.5 py-0.5 rounded bg-green-500/10 text-green-600 text-xs font-semibold">
                            202
                          </code>
                        </td>
                        <td className="px-4 py-3 text-[var(--muted-foreground)]">
                          Change notifications accepted and processed
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3">
                          <code className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 text-xs font-semibold">
                            400
                          </code>
                        </td>
                        <td className="px-4 py-3 text-[var(--muted-foreground)]">
                          Invalid payload or missing validationToken
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3">
                          <code className="px-1.5 py-0.5 rounded bg-red-500/10 text-red-600 text-xs font-semibold">
                            404
                          </code>
                        </td>
                        <td className="px-4 py-3 text-[var(--muted-foreground)]">
                          Tenant not found
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3">
                          <code className="px-1.5 py-0.5 rounded bg-red-500/10 text-red-600 text-xs font-semibold">
                            500
                          </code>
                        </td>
                        <td className="px-4 py-3 text-[var(--muted-foreground)]">
                          Internal server error &mdash; Microsoft will retry with exponential backoff
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Important Notes */}
              <div>
                <h3 className="text-sm font-semibold text-[var(--foreground)] mb-3">
                  Troubleshooting
                </h3>
                <div className="overflow-x-auto rounded-lg border border-[var(--border)]">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-[var(--secondary)]">
                        <th className="px-4 py-3 text-left font-medium text-[var(--foreground)] whitespace-nowrap">
                          Error
                        </th>
                        <th className="px-4 py-3 text-left font-medium text-[var(--foreground)]">
                          Cause &amp; Fix
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)]">
                      <tr>
                        <td className="px-4 py-3 text-[var(--foreground)] font-medium whitespace-nowrap">
                          Access is denied (403)
                        </td>
                        <td className="px-4 py-3 text-[var(--muted-foreground)]">
                          Your app is missing the <code className="text-xs font-semibold">Mail.Read</code> Application
                          permission, or admin consent hasn&apos;t been granted. Go to API permissions in Azure Portal
                          and click &quot;Grant admin consent.&quot;
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 text-[var(--foreground)] font-medium whitespace-nowrap">
                          Validation request failed
                        </td>
                        <td className="px-4 py-3 text-[var(--muted-foreground)]">
                          Microsoft couldn&apos;t reach your webhook URL or it didn&apos;t respond correctly.
                          Ensure your app is deployed to a publicly accessible HTTPS URL (not localhost).
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 text-[var(--foreground)] font-medium whitespace-nowrap">
                          /me request is only valid...
                        </td>
                        <td className="px-4 py-3 text-[var(--muted-foreground)]">
                          The resource path used <code className="text-xs">/me/</code> which requires delegated auth.
                          Client credentials flow must use <code className="text-xs">users/&#123;email&#125;/mailFolders/inbox/messages</code>.
                          This is handled automatically when you enter a mailbox email above.
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 text-[var(--foreground)] font-medium whitespace-nowrap">
                          Token request failed
                        </td>
                        <td className="px-4 py-3 text-[var(--muted-foreground)]">
                          The Azure Tenant ID, Client ID, or Client Secret is incorrect. Double-check the values
                          in your app registration. Use &quot;Test Connection&quot; to verify.
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-[var(--foreground)] mb-3">
                  Important Notes
                </h3>
                <div className="space-y-3">
                  <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-sm text-[var(--foreground)]">
                    <span className="font-medium">Subscription Expiry:</span> Mail subscriptions
                    expire after a maximum of 3 days. Set up automated renewal or create a new
                    subscription when the current one expires. The active subscriptions list above
                    shows expiration dates.
                  </div>
                  <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-sm text-[var(--foreground)]">
                    <span className="font-medium">Notification-only:</span> Graph change notifications
                    contain only metadata (message ID, resource path) &mdash; not the full email content.
                    To fetch the full email, a follow-up Graph API call is needed using the app&apos;s credentials.
                  </div>
                </div>
              </div>
            </div>
          </section>}

          {/* Gmail Section */}
          {activeTab === "gmail" && <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
            <div className="px-6 py-5 border-b border-[var(--border)]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#EA4335] flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                    <path d="M20 18h-2V9.25L12 13 6 9.25V18H4V6h1.2l6.8 4.25L18.8 6H20m0-2H4c-1.11 0-2 .89-2 2v12a2 2 0 002 2h16a2 2 0 002-2V6a2 2 0 00-2-2z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-[var(--foreground)]">
                    Gmail / Google Workspace Email
                  </h2>
                  <p className="text-sm text-[var(--muted-foreground)]">
                    Ingest emails via Google Pub/Sub or Apps Script
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-8">
              {/* Webhook URL */}
              <div>
                <h3 className="text-sm font-semibold text-[var(--foreground)] mb-2">
                  Your Webhook URL
                </h3>
                <p className="text-sm text-[var(--muted-foreground)] mb-3">
                  This is your tenant-specific endpoint. Use it as the Pub/Sub push
                  subscription URL or the Apps Script POST target.
                </p>
                <div className="flex items-center p-3 rounded-lg bg-[var(--secondary)] border border-[var(--border)]">
                  <code className="flex-1 text-sm text-[var(--foreground)] break-all">
                    {gmailWebhookUrl}
                  </code>
                  <CopyButton text={gmailWebhookUrl} />
                </div>
              </div>

              {/* Authentication */}
              <div>
                <h3 className="text-sm font-semibold text-[var(--foreground)] mb-2">
                  Authentication
                </h3>
                <p className="text-sm text-[var(--muted-foreground)] mb-3">
                  Requests are authenticated via a <code className="px-1.5 py-0.5 rounded bg-[var(--secondary)] text-[var(--foreground)] text-xs">?token=</code> query
                  parameter, <code className="px-1.5 py-0.5 rounded bg-[var(--secondary)] text-[var(--foreground)] text-xs">X-API-Key</code> header,
                  or <code className="px-1.5 py-0.5 rounded bg-[var(--secondary)] text-[var(--foreground)] text-xs">Authorization: Bearer</code> header
                  matching the <code className="px-1.5 py-0.5 rounded bg-[var(--secondary)] text-[var(--foreground)] text-xs">GMAIL_WEBHOOK_SECRET</code> environment
                  variable.
                </p>
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-sm text-[var(--foreground)]">
                  Contact your server administrator for the secret value. It is
                  defined as the <code className="font-mono">GMAIL_WEBHOOK_SECRET</code> environment
                  variable.
                </div>
              </div>

              {/* Gmail Watch Manager */}
              <GmailWatchManager />

              {/* Setup Option A */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-green-500/10 text-green-600 border border-green-500/20">
                    Recommended
                  </span>
                  <h3 className="text-sm font-semibold text-[var(--foreground)]">
                    Setup Option A &mdash; Full Integration (Pub/Sub)
                  </h3>
                </div>

                <ol className="space-y-6">
                  <li className="flex gap-4">
                    <span className="flex-shrink-0 w-7 h-7 rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] flex items-center justify-center text-sm font-semibold">
                      1
                    </span>
                    <div className="flex-1">
                      <p className="font-medium text-[var(--foreground)]">
                        Enable the Gmail API
                      </p>
                      <p className="text-sm text-[var(--muted-foreground)] mt-1">
                        Go to{" "}
                        <span className="font-medium text-[var(--foreground)]">Google Cloud Console</span>{" "}
                        &rarr; <span className="font-medium text-[var(--foreground)]">APIs &amp; Services</span>{" "}
                        &rarr; <span className="font-medium text-[var(--foreground)]">Enable APIs</span>{" "}
                        &rarr; search for &quot;Gmail API&quot; and enable it.
                      </p>
                    </div>
                  </li>

                  <li className="flex gap-4">
                    <span className="flex-shrink-0 w-7 h-7 rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] flex items-center justify-center text-sm font-semibold">
                      2
                    </span>
                    <div className="flex-1">
                      <p className="font-medium text-[var(--foreground)]">
                        Create a Pub/Sub Topic
                      </p>
                      <p className="text-sm text-[var(--muted-foreground)] mt-1">
                        In the same Google Cloud project, create a Pub/Sub topic named{" "}
                        <code className="px-1.5 py-0.5 rounded bg-[var(--secondary)] text-[var(--foreground)] text-xs">gmail-inbound</code>.
                      </p>
                    </div>
                  </li>

                  <li className="flex gap-4">
                    <span className="flex-shrink-0 w-7 h-7 rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] flex items-center justify-center text-sm font-semibold">
                      3
                    </span>
                    <div className="flex-1">
                      <p className="font-medium text-[var(--foreground)]">
                        Create a Push Subscription
                      </p>
                      <p className="text-sm text-[var(--muted-foreground)] mt-1">
                        Create a push subscription on the topic pointing to your webhook URL
                        with the token appended:
                      </p>
                      <div className="flex items-center mt-3 p-2 rounded bg-[var(--secondary)] border border-[var(--border)]">
                        <code className="text-sm text-[var(--foreground)] break-all">
                          {gmailWebhookUrl}?token=YOUR_SECRET
                        </code>
                      </div>
                    </div>
                  </li>

                  <li className="flex gap-4">
                    <span className="flex-shrink-0 w-7 h-7 rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] flex items-center justify-center text-sm font-semibold">
                      4
                    </span>
                    <div className="flex-1">
                      <p className="font-medium text-[var(--foreground)]">
                        Grant Publish Rights
                      </p>
                      <p className="text-sm text-[var(--muted-foreground)] mt-1">
                        Grant the <code className="px-1.5 py-0.5 rounded bg-[var(--secondary)] text-[var(--foreground)] text-xs">Pub/Sub Publisher</code> role
                        to <code className="px-1.5 py-0.5 rounded bg-[var(--secondary)] text-[var(--foreground)] text-xs">gmail-api-push@system.gserviceaccount.com</code> on
                        your Pub/Sub topic.
                      </p>
                    </div>
                  </li>

                  <li className="flex gap-4">
                    <span className="flex-shrink-0 w-7 h-7 rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] flex items-center justify-center text-sm font-semibold">
                      5
                    </span>
                    <div className="flex-1">
                      <p className="font-medium text-[var(--foreground)]">
                        Set Up Gmail Watch
                      </p>
                      <p className="text-sm text-[var(--muted-foreground)] mt-1">
                        After completing OAuth authorization, call the Gmail Watch API to start
                        monitoring the inbox:
                      </p>
                      <div className="mt-3">
                        <CodeBlock>{`POST https://gmail.googleapis.com/gmail/v1/users/me/watch
{
  "topicName": "projects/YOUR_PROJECT/topics/gmail-inbound",
  "labelIds": ["INBOX"],
  "labelFilterBehavior": "INCLUDE"
}`}</CodeBlock>
                      </div>
                      <p className="text-sm text-[var(--muted-foreground)] mt-3">
                        Watch subscriptions expire after 7 days. Set up a daily job to renew
                        watches expiring within 24 hours.
                      </p>
                    </div>
                  </li>

                  <li className="flex gap-4">
                    <span className="flex-shrink-0 w-7 h-7 rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] flex items-center justify-center text-sm font-semibold">
                      6
                    </span>
                    <div className="flex-1">
                      <p className="font-medium text-[var(--foreground)]">
                        Test the Integration
                      </p>
                      <p className="text-sm text-[var(--muted-foreground)] mt-1">
                        Send a test email to the monitored Gmail account. The Pub/Sub notification
                        should arrive at your webhook endpoint within seconds. Check server logs
                        for confirmation.
                      </p>
                    </div>
                  </li>
                </ol>
              </div>

              {/* Setup Option B */}
              <div className="border-t border-[var(--border)] pt-8">
                <h3 className="text-sm font-semibold text-[var(--foreground)] mb-4">
                  Setup Option B &mdash; Apps Script (Simpler)
                </h3>
                <p className="text-sm text-[var(--muted-foreground)] mb-4">
                  For a simpler setup that doesn&apos;t require Pub/Sub or OAuth on your backend,
                  deploy this Google Apps Script template. It polls Gmail and POSTs directly to
                  your webhook with a delay of up to 1 minute.
                </p>

                <ol className="space-y-6">
                  <li className="flex gap-4">
                    <span className="flex-shrink-0 w-7 h-7 rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] flex items-center justify-center text-sm font-semibold">
                      1
                    </span>
                    <div className="flex-1">
                      <p className="font-medium text-[var(--foreground)]">
                        Create an Apps Script Project
                      </p>
                      <p className="text-sm text-[var(--muted-foreground)] mt-1">
                        Open{" "}
                        <span className="font-medium text-[var(--foreground)]">script.google.com</span>{" "}
                        while signed into the Gmail account you want to monitor. Create a new project.
                      </p>
                    </div>
                  </li>

                  <li className="flex gap-4">
                    <span className="flex-shrink-0 w-7 h-7 rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] flex items-center justify-center text-sm font-semibold">
                      2
                    </span>
                    <div className="flex-1">
                      <p className="font-medium text-[var(--foreground)]">
                        Paste the Script Template
                      </p>
                      <p className="text-sm text-[var(--muted-foreground)] mt-1">
                        Replace the default code with the following, using your webhook URL and
                        API key:
                      </p>
                      <div className="mt-3">
                        <CodeBlock>{`function checkNewEmails() {
  var webhookUrl = "${gmailWebhookUrl}";
  var apiKey = "YOUR_GMAIL_WEBHOOK_SECRET";
  var lastRun = PropertiesService.getScriptProperties()
                  .getProperty("lastRun") || "2000/01/01";

  var threads = GmailApp.search("after:" + lastRun + " in:inbox");

  for (var i = 0; i < threads.length; i++) {
    var messages = threads[i].getMessages();
    for (var j = 0; j < messages.length; j++) {
      var msg = messages[j];
      var payload = {
        messageId: msg.getId(),
        sender: msg.getFrom(),
        recipients: msg.getTo(),
        subject: msg.getSubject(),
        bodyPlain: msg.getPlainBody(),
        bodyHtml: msg.getBody(),
        receivedAt: msg.getDate().toISOString()
      };

      UrlFetchApp.fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": apiKey
        },
        payload: JSON.stringify(payload),
        muteHttpExceptions: true
      });
    }
  }

  PropertiesService.getScriptProperties()
    .setProperty("lastRun",
      new Date().toLocaleDateString("en-US"));
}`}</CodeBlock>
                      </div>
                    </div>
                  </li>

                  <li className="flex gap-4">
                    <span className="flex-shrink-0 w-7 h-7 rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] flex items-center justify-center text-sm font-semibold">
                      3
                    </span>
                    <div className="flex-1">
                      <p className="font-medium text-[var(--foreground)]">
                        Run Once Manually
                      </p>
                      <p className="text-sm text-[var(--muted-foreground)] mt-1">
                        Click <span className="font-medium text-[var(--foreground)]">Run</span> to
                        execute the function once and grant the required Gmail permissions.
                      </p>
                    </div>
                  </li>

                  <li className="flex gap-4">
                    <span className="flex-shrink-0 w-7 h-7 rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] flex items-center justify-center text-sm font-semibold">
                      4
                    </span>
                    <div className="flex-1">
                      <p className="font-medium text-[var(--foreground)]">
                        Set Up a Time Trigger
                      </p>
                      <p className="text-sm text-[var(--muted-foreground)] mt-1">
                        Go to <span className="font-medium text-[var(--foreground)]">Triggers</span>{" "}
                        &rarr; <span className="font-medium text-[var(--foreground)]">Add Trigger</span>{" "}
                        &rarr; set <code className="px-1.5 py-0.5 rounded bg-[var(--secondary)] text-[var(--foreground)] text-xs">checkNewEmails</code> to
                        run every 1 minute.
                      </p>
                    </div>
                  </li>
                </ol>
              </div>

              {/* Field Mapping Reference */}
              <div className="border-t border-[var(--border)] pt-8">
                <h3 className="text-sm font-semibold text-[var(--foreground)] mb-3">
                  Field Mapping Reference (Apps Script)
                </h3>
                <div className="overflow-x-auto rounded-lg border border-[var(--border)]">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-[var(--secondary)]">
                        <th className="px-4 py-3 text-left font-medium text-[var(--foreground)]">
                          Apps Script / Gmail Value
                        </th>
                        <th className="px-4 py-3 text-left font-medium text-[var(--foreground)]">
                          Webhook Payload Key
                        </th>
                        <th className="px-4 py-3 text-left font-medium text-[var(--foreground)]">
                          Description
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)]">
                      {GMAIL_FIELD_MAPPING.map((field) => (
                        <tr key={field.payload}>
                          <td className="px-4 py-3">
                            <code className="px-1.5 py-0.5 rounded bg-[var(--secondary)] text-[var(--foreground)] text-xs">
                              {field.appsScript}
                            </code>
                          </td>
                          <td className="px-4 py-3">
                            <code className="px-1.5 py-0.5 rounded bg-[var(--secondary)] text-[var(--foreground)] text-xs">
                              {field.payload}
                            </code>
                          </td>
                          <td className="px-4 py-3 text-[var(--muted-foreground)]">
                            {field.description}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Response Codes */}
              <div>
                <h3 className="text-sm font-semibold text-[var(--foreground)] mb-3">
                  Response Codes
                </h3>
                <div className="overflow-x-auto rounded-lg border border-[var(--border)]">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-[var(--secondary)]">
                        <th className="px-4 py-3 text-left font-medium text-[var(--foreground)]">
                          Code
                        </th>
                        <th className="px-4 py-3 text-left font-medium text-[var(--foreground)]">
                          Meaning
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)]">
                      <tr>
                        <td className="px-4 py-3">
                          <code className="px-1.5 py-0.5 rounded bg-green-500/10 text-green-600 text-xs font-semibold">
                            200
                          </code>
                        </td>
                        <td className="px-4 py-3 text-[var(--muted-foreground)]">
                          Success or duplicate &mdash; Pub/Sub will not retry on 200
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3">
                          <code className="px-1.5 py-0.5 rounded bg-green-500/10 text-green-600 text-xs font-semibold">
                            201
                          </code>
                        </td>
                        <td className="px-4 py-3 text-[var(--muted-foreground)]">
                          Email received and stored successfully (Apps Script path)
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3">
                          <code className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 text-xs font-semibold">
                            400
                          </code>
                        </td>
                        <td className="px-4 py-3 text-[var(--muted-foreground)]">
                          Payload malformed or tenant resolution failed
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3">
                          <code className="px-1.5 py-0.5 rounded bg-red-500/10 text-red-600 text-xs font-semibold">
                            401
                          </code>
                        </td>
                        <td className="px-4 py-3 text-[var(--muted-foreground)]">
                          Auth token invalid
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3">
                          <code className="px-1.5 py-0.5 rounded bg-red-500/10 text-red-600 text-xs font-semibold">
                            500
                          </code>
                        </td>
                        <td className="px-4 py-3 text-[var(--muted-foreground)]">
                          Internal error &mdash; Pub/Sub will retry with exponential backoff
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </section>}

          {/* Zoom Chat Section */}
          {activeTab === "zoom" && <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
            <div className="px-6 py-5 border-b border-[var(--border)]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#2D8CFF] flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                    <path d="M4 3a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h8l4 4v-4h4a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2H4z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-[var(--foreground)]">
                    Zoom Chat
                  </h2>
                  <p className="text-sm text-[var(--muted-foreground)]">
                    Capture DMs and channel messages via Zoom webhooks
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-8">
              {/* Description */}
              <div>
                <p className="text-sm text-[var(--muted-foreground)]">
                  The Zoom Chat integration captures all direct messages and channel messages
                  in real-time via a Zoom Marketplace OAuth app. Messages are persisted with
                  full multi-tenant isolation and support for message edits and deletions.
                </p>
              </div>

              {/* Prerequisites */}
              <div className="p-5 rounded-lg border-2 border-blue-500/30 bg-blue-500/5 space-y-4">
                <div className="flex items-center gap-2">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 16v-4" />
                    <path d="M12 8h.01" />
                  </svg>
                  <h3 className="text-sm font-semibold text-[var(--foreground)]">
                    Zoom Marketplace Setup Required
                  </h3>
                </div>
                <p className="text-sm text-[var(--muted-foreground)]">
                  Before connecting, you need to create an OAuth app in the Zoom Marketplace.
                  Complete these steps first.
                </p>

                <ol className="space-y-4 text-sm">
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500/20 text-blue-600 flex items-center justify-center text-xs font-bold">1</span>
                    <div>
                      <p className="text-[var(--foreground)] font-medium">Create a Zoom OAuth App</p>
                      <p className="text-[var(--muted-foreground)] mt-0.5">
                        Go to the Zoom Marketplace &rarr; Develop &rarr; Build App &rarr;
                        Select <span className="font-semibold text-[var(--foreground)]">User-managed</span> OAuth app type.
                      </p>
                    </div>
                  </li>

                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500/20 text-blue-600 flex items-center justify-center text-xs font-bold">2</span>
                    <div>
                      <p className="text-[var(--foreground)] font-medium">Configure OAuth Scopes</p>
                      <p className="text-[var(--muted-foreground)] mt-0.5">
                        Add the following scopes:
                      </p>
                      <div className="mt-2 space-y-1">
                        <div className="p-2 rounded-md bg-[var(--secondary)] border border-[var(--border)]">
                          <code className="text-xs text-[var(--foreground)] font-semibold">chat_message:read</code>
                          <span className="text-xs text-[var(--muted-foreground)] ml-2">&mdash; Read chat messages</span>
                        </div>
                        <div className="p-2 rounded-md bg-[var(--secondary)] border border-[var(--border)]">
                          <code className="text-xs text-[var(--foreground)] font-semibold">chat_channel:read</code>
                          <span className="text-xs text-[var(--muted-foreground)] ml-2">&mdash; Read chat channels</span>
                        </div>
                      </div>
                    </div>
                  </li>

                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500/20 text-blue-600 flex items-center justify-center text-xs font-bold">3</span>
                    <div>
                      <p className="text-[var(--foreground)] font-medium">Configure Event Subscriptions</p>
                      <p className="text-[var(--muted-foreground)] mt-0.5">
                        In the app&apos;s Feature &rarr; Event Subscriptions, add a subscription
                        with the following events and set the Event notification endpoint URL:
                      </p>
                      <div className="mt-2 space-y-1">
                        <div className="p-2 rounded-md bg-[var(--secondary)] border border-[var(--border)]">
                          <code className="text-xs text-[var(--foreground)] font-semibold">chat_message.sent</code>
                          <span className="text-xs text-[var(--muted-foreground)] ml-2">&mdash; New message sent</span>
                        </div>
                        <div className="p-2 rounded-md bg-[var(--secondary)] border border-[var(--border)]">
                          <code className="text-xs text-[var(--foreground)] font-semibold">chat_message.updated</code>
                          <span className="text-xs text-[var(--muted-foreground)] ml-2">&mdash; Message edited</span>
                        </div>
                        <div className="p-2 rounded-md bg-[var(--secondary)] border border-[var(--border)]">
                          <code className="text-xs text-[var(--foreground)] font-semibold">chat_message.deleted</code>
                          <span className="text-xs text-[var(--muted-foreground)] ml-2">&mdash; Message deleted</span>
                        </div>
                      </div>
                    </div>
                  </li>

                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500/20 text-blue-600 flex items-center justify-center text-xs font-bold">4</span>
                    <div>
                      <p className="text-[var(--foreground)] font-medium">Set Redirect &amp; Webhook URLs</p>
                      <p className="text-[var(--muted-foreground)] mt-0.5">
                        Set the OAuth redirect URL and the event notification endpoint URL in your
                        Zoom app configuration:
                      </p>
                      <div className="mt-2 space-y-2">
                        <div>
                          <span className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">
                            OAuth Redirect URL
                          </span>
                          <div className="mt-1 flex items-center p-2 rounded-md bg-[var(--secondary)] border border-[var(--border)]">
                            <code className="flex-1 text-sm text-[var(--foreground)] break-all">
                              {`${typeof window !== "undefined" ? window.location.origin : "https://your-domain.com"}/api/zoom/oauth/callback`}
                            </code>
                            <CopyButton text={`${typeof window !== "undefined" ? window.location.origin : "https://your-domain.com"}/api/zoom/oauth/callback`} />
                          </div>
                        </div>
                        <div>
                          <span className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">
                            Event Notification Endpoint URL
                          </span>
                          <div className="mt-1 flex items-center p-2 rounded-md bg-[var(--secondary)] border border-[var(--border)]">
                            <code className="flex-1 text-sm text-[var(--foreground)] break-all">
                              {zoomWebhookUrl}
                            </code>
                            <CopyButton text={zoomWebhookUrl} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>

                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500/20 text-blue-600 flex items-center justify-center text-xs font-bold">5</span>
                    <div>
                      <p className="text-[var(--foreground)] font-medium">Copy App Credentials</p>
                      <p className="text-[var(--muted-foreground)] mt-0.5">
                        Copy the <span className="font-semibold text-[var(--foreground)]">Client ID</span>,{" "}
                        <span className="font-semibold text-[var(--foreground)]">Client Secret</span>, and{" "}
                        <span className="font-semibold text-[var(--foreground)]">Secret Token</span> (from webhook settings)
                        into your server&apos;s environment variables:
                      </p>
                      <div className="mt-2 p-2.5 rounded-md bg-[var(--secondary)] border border-[var(--border)]">
                        <code className="text-xs text-[var(--foreground)]">
                          ZOOM_CLIENT_ID=your_client_id<br />
                          ZOOM_CLIENT_SECRET=your_client_secret<br />
                          ZOOM_WEBHOOK_SECRET_TOKEN=your_secret_token<br />
                          NEXT_PUBLIC_ZOOM_CLIENT_ID=your_client_id
                        </code>
                      </div>
                    </div>
                  </li>
                </ol>
              </div>

              {/* OAuth Connection */}
              <div>
                <h3 className="text-sm font-semibold text-[var(--foreground)] mb-4">
                  Connect Your Account
                </h3>
                <ZoomIntegrationManager />
              </div>

              {/* Webhook URL */}
              <div>
                <h3 className="text-sm font-semibold text-[var(--foreground)] mb-2">
                  Webhook Endpoint
                </h3>
                <p className="text-sm text-[var(--muted-foreground)] mb-3">
                  This is the shared webhook endpoint for Zoom events. Zoom identifies the
                  tenant via the account_id in the webhook payload (matched to the OAuth connection).
                </p>
                <div className="flex items-center p-3 rounded-lg bg-[var(--secondary)] border border-[var(--border)]">
                  <code className="flex-1 text-sm text-[var(--foreground)] break-all">
                    {zoomWebhookUrl}
                  </code>
                  <CopyButton text={zoomWebhookUrl} />
                </div>
              </div>

              {/* Supported Events */}
              <div>
                <h3 className="text-sm font-semibold text-[var(--foreground)] mb-3">
                  Supported Events
                </h3>
                <div className="overflow-x-auto rounded-lg border border-[var(--border)]">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-[var(--secondary)]">
                        <th className="px-4 py-3 text-left font-medium text-[var(--foreground)]">
                          Event
                        </th>
                        <th className="px-4 py-3 text-left font-medium text-[var(--foreground)]">
                          Description
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)]">
                      <tr>
                        <td className="px-4 py-3">
                          <code className="px-1.5 py-0.5 rounded bg-[var(--secondary)] text-[var(--foreground)] text-xs">
                            chat_message.sent
                          </code>
                        </td>
                        <td className="px-4 py-3 text-[var(--muted-foreground)]">
                          New DM or channel message is sent &mdash; stored as a new record
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3">
                          <code className="px-1.5 py-0.5 rounded bg-[var(--secondary)] text-[var(--foreground)] text-xs">
                            chat_message.updated
                          </code>
                        </td>
                        <td className="px-4 py-3 text-[var(--muted-foreground)]">
                          Message is edited &mdash; existing record is updated with new content
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3">
                          <code className="px-1.5 py-0.5 rounded bg-[var(--secondary)] text-[var(--foreground)] text-xs">
                            chat_message.deleted
                          </code>
                        </td>
                        <td className="px-4 py-3 text-[var(--muted-foreground)]">
                          Message is deleted &mdash; existing record is soft-deleted
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Response Codes */}
              <div>
                <h3 className="text-sm font-semibold text-[var(--foreground)] mb-3">
                  Webhook Response Codes
                </h3>
                <div className="overflow-x-auto rounded-lg border border-[var(--border)]">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-[var(--secondary)]">
                        <th className="px-4 py-3 text-left font-medium text-[var(--foreground)]">
                          Code
                        </th>
                        <th className="px-4 py-3 text-left font-medium text-[var(--foreground)]">
                          Meaning
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)]">
                      <tr>
                        <td className="px-4 py-3">
                          <code className="px-1.5 py-0.5 rounded bg-green-500/10 text-green-600 text-xs font-semibold">
                            200
                          </code>
                        </td>
                        <td className="px-4 py-3 text-[var(--muted-foreground)]">
                          Duplicate message, URL validation, or unhandled event type (safe to ignore)
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3">
                          <code className="px-1.5 py-0.5 rounded bg-green-500/10 text-green-600 text-xs font-semibold">
                            201
                          </code>
                        </td>
                        <td className="px-4 py-3 text-[var(--muted-foreground)]">
                          Chat message received and stored successfully
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3">
                          <code className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 text-xs font-semibold">
                            400
                          </code>
                        </td>
                        <td className="px-4 py-3 text-[var(--muted-foreground)]">
                          Validation error &mdash; invalid payload structure
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3">
                          <code className="px-1.5 py-0.5 rounded bg-red-500/10 text-red-600 text-xs font-semibold">
                            403
                          </code>
                        </td>
                        <td className="px-4 py-3 text-[var(--muted-foreground)]">
                          Webhook signature verification failed
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3">
                          <code className="px-1.5 py-0.5 rounded bg-red-500/10 text-red-600 text-xs font-semibold">
                            500
                          </code>
                        </td>
                        <td className="px-4 py-3 text-[var(--muted-foreground)]">
                          Internal server error &mdash; Zoom will retry with exponential backoff
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Important Notes */}
              <div>
                <h3 className="text-sm font-semibold text-[var(--foreground)] mb-3">
                  Important Notes
                </h3>
                <div className="space-y-3">
                  <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-sm text-[var(--foreground)]">
                    <span className="font-medium">Token Refresh:</span> Zoom access tokens expire
                    after 1 hour. The system automatically refreshes tokens using the stored refresh
                    token when needed.
                  </div>
                  <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-sm text-[var(--foreground)]">
                    <span className="font-medium">Multi-tenant Isolation:</span> Zoom identifies
                    your account via the <code className="px-1 py-0.5 rounded bg-[var(--secondary)] text-xs">account_id</code> in
                    webhook payloads. Each webhook event is routed to the correct tenant automatically.
                  </div>
                  <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-sm text-[var(--foreground)]">
                    <span className="font-medium">Message Types:</span> Both direct messages (DMs)
                    and channel messages are captured and tagged with their type for easy filtering.
                  </div>
                </div>
              </div>
            </div>
          </section>}

          {/* Outlook.com Section */}
          {activeTab === "outlook" && <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
            <div className="px-6 py-5 border-b border-[var(--border)]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#0078D4] flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-[var(--foreground)]">
                    Outlook.com (Personal)
                  </h2>
                  <p className="text-sm text-[var(--muted-foreground)]">
                    Read emails from personal Microsoft accounts via OAuth
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-8">
              {/* Description */}
              <div>
                <p className="text-sm text-[var(--muted-foreground)]">
                  This integration connects to personal Microsoft accounts (Outlook.com, Hotmail, Live.com)
                  using the Microsoft identity platform v2.0 with delegated OAuth permissions. Unlike the
                  Graph API integration (which uses app-only auth for organizational mailboxes), this uses
                  the authorization code flow where you sign in and consent to share your mailbox.
                </p>
              </div>

              {/* Azure Portal Requirements */}
              <div className="p-5 rounded-lg border-2 border-blue-500/30 bg-blue-500/5 space-y-4">
                <div className="flex items-center gap-2">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 16v-4" />
                    <path d="M12 8h.01" />
                  </svg>
                  <h3 className="text-sm font-semibold text-[var(--foreground)]">
                    Azure App Registration Required
                  </h3>
                </div>
                <p className="text-sm text-[var(--muted-foreground)]">
                  Before connecting, your server administrator needs to register an app in Azure Portal
                  that supports personal Microsoft accounts.
                </p>

                <ol className="space-y-4 text-sm">
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500/20 text-blue-600 flex items-center justify-center text-xs font-bold">1</span>
                    <div>
                      <p className="text-[var(--foreground)] font-medium">Create an App Registration</p>
                      <p className="text-[var(--muted-foreground)] mt-0.5">
                        Azure Portal &rarr; Microsoft Entra ID &rarr; App registrations &rarr; New registration.
                        Under Supported account types, select{" "}
                        <span className="font-semibold text-[var(--foreground)]">&quot;Accounts in any organizational directory and personal Microsoft accounts&quot;</span>.
                      </p>
                    </div>
                  </li>

                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500/20 text-blue-600 flex items-center justify-center text-xs font-bold">2</span>
                    <div>
                      <p className="text-[var(--foreground)] font-medium">Configure Redirect URI</p>
                      <p className="text-[var(--muted-foreground)] mt-0.5">
                        Add a Web redirect URI:
                      </p>
                      <div className="mt-2 flex items-center p-2.5 rounded-md bg-[var(--secondary)] border border-[var(--border)]">
                        <code className="flex-1 text-xs text-[var(--foreground)] break-all">
                          {typeof window !== "undefined" ? window.location.origin : "https://your-domain.com"}/api/outlook/oauth/callback
                        </code>
                        <CopyButton text={`${typeof window !== "undefined" ? window.location.origin : "https://your-domain.com"}/api/outlook/oauth/callback`} />
                      </div>
                    </div>
                  </li>

                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500/20 text-blue-600 flex items-center justify-center text-xs font-bold">3</span>
                    <div>
                      <p className="text-[var(--foreground)] font-medium">Add API Permissions</p>
                      <p className="text-[var(--muted-foreground)] mt-0.5">
                        Add <span className="font-semibold text-[var(--foreground)]">Delegated</span> permissions (not Application):
                      </p>
                      <div className="mt-2 space-y-1">
                        <div className="p-2 rounded-md bg-[var(--secondary)] border border-[var(--border)]">
                          <code className="text-xs text-[var(--foreground)] font-semibold">Mail.Read</code>
                          <span className="text-xs text-[var(--muted-foreground)] ml-2">&mdash; Read user mail</span>
                        </div>
                        <div className="p-2 rounded-md bg-[var(--secondary)] border border-[var(--border)]">
                          <code className="text-xs text-[var(--foreground)] font-semibold">User.Read</code>
                          <span className="text-xs text-[var(--muted-foreground)] ml-2">&mdash; Read user profile (for email address)</span>
                        </div>
                        <div className="p-2 rounded-md bg-[var(--secondary)] border border-[var(--border)]">
                          <code className="text-xs text-[var(--foreground)] font-semibold">offline_access</code>
                          <span className="text-xs text-[var(--muted-foreground)] ml-2">&mdash; Maintain access via refresh token</span>
                        </div>
                      </div>
                    </div>
                  </li>

                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500/20 text-blue-600 flex items-center justify-center text-xs font-bold">4</span>
                    <div>
                      <p className="text-[var(--foreground)] font-medium">Create a Client Secret</p>
                      <p className="text-[var(--muted-foreground)] mt-0.5">
                        In Certificates &amp; secrets, create a new client secret and copy the Value.
                      </p>
                    </div>
                  </li>

                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500/20 text-blue-600 flex items-center justify-center text-xs font-bold">5</span>
                    <div>
                      <p className="text-[var(--foreground)] font-medium">Set Server Environment Variables</p>
                      <p className="text-[var(--muted-foreground)] mt-0.5">
                        Add these to your server&apos;s environment:
                      </p>
                      <div className="mt-2 p-2.5 rounded-md bg-[var(--secondary)] border border-[var(--border)]">
                        <code className="text-xs text-[var(--foreground)]">
                          OUTLOOK_CLIENT_ID=your_application_client_id<br />
                          OUTLOOK_CLIENT_SECRET=your_client_secret_value
                        </code>
                      </div>
                    </div>
                  </li>
                </ol>
              </div>

              {/* OAuth Connection */}
              <div>
                <h3 className="text-sm font-semibold text-[var(--foreground)] mb-4">
                  Connect Your Account
                </h3>
                <OutlookIntegrationManager />
              </div>

              {/* How It Works */}
              <div>
                <h3 className="text-sm font-semibold text-[var(--foreground)] mb-3">
                  How It Works
                </h3>
                <div className="overflow-x-auto rounded-lg border border-[var(--border)]">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-[var(--secondary)]">
                        <th className="px-4 py-3 text-left font-medium text-[var(--foreground)]">
                          Step
                        </th>
                        <th className="px-4 py-3 text-left font-medium text-[var(--foreground)]">
                          What Happens
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)]">
                      <tr>
                        <td className="px-4 py-3 font-medium text-[var(--foreground)]">
                          Connect
                        </td>
                        <td className="px-4 py-3 text-[var(--muted-foreground)]">
                          You sign in with your Microsoft account and consent to share your mailbox.
                          Tokens are stored securely.
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 font-medium text-[var(--foreground)]">
                          Sync
                        </td>
                        <td className="px-4 py-3 text-[var(--muted-foreground)]">
                          Click &quot;Sync Emails Now&quot; to pull recent inbox messages. The system
                          deduplicates and only imports new emails.
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 font-medium text-[var(--foreground)]">
                          Auto-refresh
                        </td>
                        <td className="px-4 py-3 text-[var(--muted-foreground)]">
                          Access tokens expire after ~1 hour. The system automatically refreshes
                          using your stored refresh token.
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Important Notes */}
              <div>
                <h3 className="text-sm font-semibold text-[var(--foreground)] mb-3">
                  Important Notes
                </h3>
                <div className="space-y-3">
                  <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-sm text-[var(--foreground)]">
                    <span className="font-medium">Pull-based sync:</span> Unlike the Graph API
                    integration which uses push notifications, this integration requires manual or
                    scheduled syncs via the &quot;Sync Emails Now&quot; button.
                  </div>
                  <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-sm text-[var(--foreground)]">
                    <span className="font-medium">Personal accounts only:</span> This uses
                    the <code className="px-1 py-0.5 rounded bg-[var(--secondary)] text-xs">/consumers</code> authority
                    endpoint. For organizational (work/school) accounts, use the Graph API tab instead.
                  </div>
                  <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-sm text-[var(--foreground)]">
                    <span className="font-medium">Rate limits:</span> Personal Microsoft accounts
                    have more restrictive rate limits than Microsoft 365 accounts. The sync fetches
                    up to 50 messages per request.
                  </div>
                </div>
              </div>
            </div>
          </section>}

          {/* Crisp Meeting Webhook Section */}
          {activeTab === "crisp" && <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
            <div className="px-6 py-5 border-b border-[var(--border)]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#4B45DC] flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 18.5a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13Z" />
                    <path d="M12 2v2" />
                    <path d="M12 20v2" />
                    <path d="m4.93 4.93 1.41 1.41" />
                    <path d="m17.66 17.66 1.41 1.41" />
                    <path d="M2 12h2" />
                    <path d="M20 12h2" />
                    <path d="m6.34 17.66-1.41 1.41" />
                    <path d="m19.07 4.93-1.41 1.41" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-[var(--foreground)]">
                    Crisp Meeting Webhooks
                  </h2>
                  <p className="text-sm text-[var(--muted-foreground)]">
                    Ingest meeting key points and transcripts from Crisp
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-8">
              {/* Description */}
              <div>
                <p className="text-sm text-[var(--muted-foreground)]">
                  The Crisp webhook integration automatically captures meeting key points and
                  transcripts as they are generated. Once configured, Crisp will send a POST
                  request to your webhook URL after each meeting, enabling AI-powered search
                  across all your meeting content. Action items are automatically extracted
                  and can be assigned to your Kanban board.
                </p>
              </div>

              {/* Default Board Selection */}
              <DefaultBoardSelector />

              {/* Webhook URL */}
              <div>
                <h3 className="text-sm font-semibold text-[var(--foreground)] mb-2">
                  Your Webhook URL
                </h3>
                <p className="text-sm text-[var(--muted-foreground)] mb-3">
                  This is your tenant-specific endpoint. Register it in your Crisp
                  workspace&apos;s webhook configuration as the delivery URL.
                </p>
                <div className="flex items-center p-3 rounded-lg bg-[var(--secondary)] border border-[var(--border)]">
                  <code className="flex-1 text-sm text-[var(--foreground)] break-all">
                    {crispWebhookUrl}
                  </code>
                  <CopyButton text={crispWebhookUrl} />
                </div>
              </div>

              {/* Authentication - Webhook Secret Manager */}
              <WebhookSecretManager />

              {/* Subscribed Events */}
              <div>
                <h3 className="text-sm font-semibold text-[var(--foreground)] mb-3">
                  Subscribed Events
                </h3>
                <p className="text-sm text-[var(--muted-foreground)] mb-3">
                  Configure Crisp to send webhooks for the following event types:
                </p>
                <div className="overflow-x-auto rounded-lg border border-[var(--border)]">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-[var(--secondary)]">
                        <th className="px-4 py-3 text-left font-medium text-[var(--foreground)]">
                          Event Type
                        </th>
                        <th className="px-4 py-3 text-left font-medium text-[var(--foreground)]">
                          Description
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)]">
                      {CRISP_EVENTS.map((e) => (
                        <tr key={e.event}>
                          <td className="px-4 py-3">
                            <code className="px-1.5 py-0.5 rounded bg-[var(--secondary)] text-[var(--foreground)] text-xs">
                              {e.event}
                            </code>
                          </td>
                          <td className="px-4 py-3 text-[var(--muted-foreground)]">
                            {e.description}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Setup Steps */}
              <div>
                <h3 className="text-sm font-semibold text-[var(--foreground)] mb-4">
                  Crisp Webhook Setup Guide
                </h3>

                <ol className="space-y-6">
                  {/* Step 1 */}
                  <li className="flex gap-4">
                    <span className="flex-shrink-0 w-7 h-7 rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] flex items-center justify-center text-sm font-semibold">
                      1
                    </span>
                    <div className="flex-1">
                      <p className="font-medium text-[var(--foreground)]">
                        Open Crisp Workspace Settings
                      </p>
                      <p className="text-sm text-[var(--muted-foreground)] mt-1">
                        Log in to your Crisp dashboard and navigate to{" "}
                        <span className="font-medium text-[var(--foreground)]">Settings</span>{" "}
                        &rarr; <span className="font-medium text-[var(--foreground)]">Integrations</span>{" "}
                        &rarr; <span className="font-medium text-[var(--foreground)]">Webhooks</span>.
                      </p>
                    </div>
                  </li>

                  {/* Step 2 */}
                  <li className="flex gap-4">
                    <span className="flex-shrink-0 w-7 h-7 rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] flex items-center justify-center text-sm font-semibold">
                      2
                    </span>
                    <div className="flex-1">
                      <p className="font-medium text-[var(--foreground)]">
                        Add a New Webhook Endpoint
                      </p>
                      <p className="text-sm text-[var(--muted-foreground)] mt-1">
                        Click <span className="font-medium text-[var(--foreground)]">&quot;Add Webhook&quot;</span> and
                        paste your webhook URL into the delivery URL field:
                      </p>
                      <div className="flex items-center mt-3 p-2 rounded bg-[var(--secondary)] border border-[var(--border)]">
                        <code className="text-sm text-[var(--foreground)] break-all">{crispWebhookUrl}</code>
                      </div>
                    </div>
                  </li>

                  {/* Step 3 */}
                  <li className="flex gap-4">
                    <span className="flex-shrink-0 w-7 h-7 rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] flex items-center justify-center text-sm font-semibold">
                      3
                    </span>
                    <div className="flex-1">
                      <p className="font-medium text-[var(--foreground)]">
                        Configure Authentication Headers
                      </p>
                      <p className="text-sm text-[var(--muted-foreground)] mt-1">
                        In Krisp&apos;s webhook Request Headers section, add an{" "}
                        <code className="px-1.5 py-0.5 rounded bg-[var(--secondary)] text-[var(--foreground)] text-xs">Authorization</code>{" "}
                        header. Then copy that same secret value and paste it into the Authentication section above.
                      </p>
                    </div>
                  </li>

                  {/* Step 4 */}
                  <li className="flex gap-4">
                    <span className="flex-shrink-0 w-7 h-7 rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] flex items-center justify-center text-sm font-semibold">
                      4
                    </span>
                    <div className="flex-1">
                      <p className="font-medium text-[var(--foreground)]">
                        Select Event Subscriptions
                      </p>
                      <p className="text-sm text-[var(--muted-foreground)] mt-1">
                        Subscribe to the events listed above. At minimum, enable{" "}
                        <code className="px-1.5 py-0.5 rounded bg-[var(--secondary)] text-[var(--foreground)] text-xs">key_points_generated</code>.
                        Optionally enable{" "}
                        <code className="px-1.5 py-0.5 rounded bg-[var(--secondary)] text-[var(--foreground)] text-xs">transcript_created</code>{" "}
                        if you want full transcript storage for AI search.
                      </p>
                    </div>
                  </li>

                  {/* Step 5 */}
                  <li className="flex gap-4">
                    <span className="flex-shrink-0 w-7 h-7 rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] flex items-center justify-center text-sm font-semibold">
                      5
                    </span>
                    <div className="flex-1">
                      <p className="font-medium text-[var(--foreground)]">
                        Verify the Payload Format
                      </p>
                      <p className="text-sm text-[var(--muted-foreground)] mt-1">
                        Ensure Crisp sends payloads matching the expected JSON structure.
                        Here is an example payload for the{" "}
                        <code className="px-1.5 py-0.5 rounded bg-[var(--secondary)] text-[var(--foreground)] text-xs">key_points_generated</code>{" "}
                        event:
                      </p>
                      <div className="mt-3">
                        <CodeBlock>{`{
  "id": "unique-webhook-id",
  "event": "key_points_generated",
  "data": {
    "meeting": {
      "id": "meeting-123",
      "title": "Weekly Standup",
      "url": "https://crisp.chat/meeting/123",
      "start_date": "2025-02-28T10:00:00Z",
      "end_date": "2025-02-28T10:30:00Z",
      "duration": 1800,
      "speakers": [
        { "index": 0, "first_name": "Jane", "last_name": "Doe" }
      ],
      "participants": ["jane@example.com"],
      "calendar_event_id": null
    },
    "content": [
      { "id": "kp1", "description": "Discussed Q1 roadmap priorities" }
    ],
    "raw_meeting": "...",
    "raw_content": "..."
  }
}`}</CodeBlock>
                      </div>
                    </div>
                  </li>

                  {/* Step 6 */}
                  <li className="flex gap-4">
                    <span className="flex-shrink-0 w-7 h-7 rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] flex items-center justify-center text-sm font-semibold">
                      6
                    </span>
                    <div className="flex-1">
                      <p className="font-medium text-[var(--foreground)]">
                        Save and Test
                      </p>
                      <p className="text-sm text-[var(--muted-foreground)] mt-1">
                        Save your webhook configuration and trigger a test event from the
                        Crisp dashboard. Verify the endpoint returns a{" "}
                        <code className="px-1.5 py-0.5 rounded bg-[var(--secondary)] text-[var(--foreground)] text-xs">201</code>{" "}
                        response. You can also check the{" "}
                        <span className="font-medium text-[var(--foreground)]">Krisp</span> page
                        in this app to confirm the meeting data appears.
                      </p>
                    </div>
                  </li>
                </ol>
              </div>

              {/* Response Codes */}
              <div>
                <h3 className="text-sm font-semibold text-[var(--foreground)] mb-3">
                  Response Codes
                </h3>
                <div className="overflow-x-auto rounded-lg border border-[var(--border)]">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-[var(--secondary)]">
                        <th className="px-4 py-3 text-left font-medium text-[var(--foreground)]">
                          Code
                        </th>
                        <th className="px-4 py-3 text-left font-medium text-[var(--foreground)]">
                          Meaning
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)]">
                      <tr>
                        <td className="px-4 py-3">
                          <code className="px-1.5 py-0.5 rounded bg-green-500/10 text-green-600 text-xs font-semibold">
                            200
                          </code>
                        </td>
                        <td className="px-4 py-3 text-[var(--muted-foreground)]">
                          Duplicate webhook &mdash; already processed (idempotent, safe to ignore)
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3">
                          <code className="px-1.5 py-0.5 rounded bg-green-500/10 text-green-600 text-xs font-semibold">
                            201
                          </code>
                        </td>
                        <td className="px-4 py-3 text-[var(--muted-foreground)]">
                          Webhook received and stored successfully
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3">
                          <code className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 text-xs font-semibold">
                            400
                          </code>
                        </td>
                        <td className="px-4 py-3 text-[var(--muted-foreground)]">
                          Validation error &mdash; missing fields, unsupported event type, or invalid payload
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3">
                          <code className="px-1.5 py-0.5 rounded bg-red-500/10 text-red-600 text-xs font-semibold">
                            401
                          </code>
                        </td>
                        <td className="px-4 py-3 text-[var(--muted-foreground)]">
                          Unauthorized &mdash; invalid or missing Authorization header
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3">
                          <code className="px-1.5 py-0.5 rounded bg-red-500/10 text-red-600 text-xs font-semibold">
                            404
                          </code>
                        </td>
                        <td className="px-4 py-3 text-[var(--muted-foreground)]">
                          User not found &mdash; the user_id in the URL does not match any account
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3">
                          <code className="px-1.5 py-0.5 rounded bg-red-500/10 text-red-600 text-xs font-semibold">
                            500
                          </code>
                        </td>
                        <td className="px-4 py-3 text-[var(--muted-foreground)]">
                          Internal server error &mdash; retry after a delay
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </section>}
        </div>
      </main>
    </div>
  );
}
