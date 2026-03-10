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
    id: "googlecalendar" as const,
    label: "Google Calendar",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.5 3h-3V1.5h-1.5V3h-6V1.5H7.5V3h-3C3.67 3 3 3.67 3 4.5v15c0 .83.67 1.5 1.5 1.5h15c.83 0 1.5-.67 1.5-1.5v-15c0-.83-.67-1.5-1.5-1.5zm0 16.5h-15V8h15v11.5zM7.5 10h3v3h-3v-3zm4.5 0h3v3h-3v-3zm4.5 0h3v3h-3v-3z" />
      </svg>
    ),
    color: "#4285F4",
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
  {
    id: "telegram" as const,
    label: "Telegram",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
      </svg>
    ),
    color: "#0088CC",
  },
  {
    id: "outbound" as const,
    label: "Outbound Webhooks",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 2 11 13" />
        <path d="m22 2-7 20-4-9-9-4 20-7z" />
      </svg>
    ),
    color: "#10B981",
  },
  {
    id: "zapier" as const,
    label: "Zapier",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M15.637 8.363l-3.26 3.26a2.862 2.862 0 01-.06 1.158 2.862 2.862 0 01-1.158.06l-3.26 3.26a.5.5 0 00.707.707l3.26-3.26a2.862 2.862 0 01.06-1.158 2.862 2.862 0 011.158-.06l3.26-3.26a.5.5 0 00-.707-.707zM12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 18c-4.418 0-8-3.582-8-8s3.582-8 8-8 8 3.582 8 8-3.582 8-8 8z" />
      </svg>
    ),
    color: "#FF4A00",
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

  const fetchStatus = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/gmail/oauth");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setStatus(data.connected ? {
        active: true,
        watch: {
          emailAddress: data.emailAddress,
          historyId: data.historyId,
          expiration: data.expiration,
          topicName: data.topicName,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        },
      } : { active: false, watch: null });
    } catch {
      setError("Failed to load Gmail connection status");
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
    if (params.get("gmail_connected") === "true") {
      setSuccess("Gmail connected successfully!");
      setTimeout(() => setSuccess(null), 5000);
      fetchStatus();
      const url = new URL(window.location.href);
      url.searchParams.delete("gmail_connected");
      url.hash = "gmail";
      window.history.replaceState({}, "", url.toString());
    }
    if (params.get("gmail_error")) {
      setError(`Gmail connection failed: ${params.get("gmail_error")}`);
      const url = new URL(window.location.href);
      url.searchParams.delete("gmail_error");
      url.hash = "gmail";
      window.history.replaceState({}, "", url.toString());
    }
  }, [fetchStatus]);

  const handleConnect = () => {
    window.location.href = "/api/gmail/oauth?action=connect";
  };

  const handleDisconnect = async () => {
    setActionLoading("disconnect");
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch("/api/gmail/oauth", { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to disconnect");
      }
      setSuccess("Gmail disconnected");
      setTimeout(() => setSuccess(null), 5000);
      await fetchStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to disconnect Gmail");
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

  const isExpiringSoon = status?.watch?.expiration
    ? new Date(status.watch.expiration).getTime() - Date.now() < 24 * 60 * 60 * 1000
    : false;

  const isExpired = status?.watch?.expiration
    ? new Date(status.watch.expiration).getTime() < Date.now()
    : false;

  return (
    <div>
      <h3 className="text-sm font-semibold text-[var(--foreground)] mb-2">
        Connection Status
      </h3>

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
              onClick={handleDisconnect}
              disabled={actionLoading !== null}
              className="px-4 py-2 text-sm font-medium rounded-md border border-red-500/30 text-red-600 hover:bg-red-500/10 transition-colors disabled:opacity-50"
            >
              {actionLoading === "disconnect" ? "Disconnecting..." : "Disconnect"}
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
              Connect your Gmail account to automatically monitor your inbox.
              The OAuth flow will grant read-only access and set up real-time
              notifications.
            </p>
          </div>

          <button
            onClick={handleConnect}
            disabled={actionLoading !== null}
            className="px-4 py-2 text-sm font-medium rounded-md bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            Connect Gmail
          </button>
        </div>
      )}
    </div>
  );
}

interface ZoomAccountInfo {
  id: string;
  zoomEmail: string;
  zoomUserId: string | null;
  tokenExpiry: string;
  isExpired: boolean;
  lastSyncAt: string | null;
  createdAt: string;
  updatedAt: string;
}

function ZoomIntegrationManager() {
  const [status, setStatus] = useState<{
    connected: boolean;
    accounts: ZoomAccountInfo[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncingAccounts, setSyncingAccounts] = useState<Set<string>>(new Set());
  const [disconnectingAccounts, setDisconnectingAccounts] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [syncResults, setSyncResults] = useState<Record<string, {
    total: number;
    inserted: number;
    skipped: number;
  }>>({});

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
      setSuccess("Zoom account connected successfully!");
      setTimeout(() => setSuccess(null), 5000);
      fetchStatus();
      const url = new URL(window.location.href);
      url.searchParams.delete("zoom_connected");
      url.hash = "zoom";
      window.history.replaceState({}, "", url.toString());
    }
    if (params.get("zoom_error")) {
      setError(`Zoom connection failed: ${params.get("zoom_error")}`);
      const url = new URL(window.location.href);
      url.searchParams.delete("zoom_error");
      url.hash = "zoom";
      window.history.replaceState({}, "", url.toString());
    }
  }, [fetchStatus]);

  const handleConnect = () => {
    window.location.href = "/api/zoom/oauth?action=connect";
  };

  const handleDisconnect = async (accountId: string) => {
    setDisconnectingAccounts((prev) => new Set(prev).add(accountId));
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`/api/zoom/oauth?accountId=${accountId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to disconnect");
      setSuccess("Zoom account disconnected");
      setTimeout(() => setSuccess(null), 5000);
      await fetchStatus();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to disconnect Zoom"
      );
    } finally {
      setDisconnectingAccounts((prev) => {
        const next = new Set(prev);
        next.delete(accountId);
        return next;
      });
    }
  };

  const handleSync = async (accountId: string) => {
    setSyncingAccounts((prev) => new Set(prev).add(accountId));
    setError(null);
    setSyncResults((prev) => {
      const next = { ...prev };
      delete next[accountId];
      return next;
    });
    try {
      const res = await fetch("/api/zoom/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Sync failed");
      setSyncResults((prev) => ({
        ...prev,
        [accountId]: { total: data.total, inserted: data.inserted, skipped: data.skipped },
      }));
      setSuccess(`Sync complete: ${data.inserted} new messages imported`);
      setTimeout(() => setSuccess(null), 5000);
      await fetchStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sync failed");
    } finally {
      setSyncingAccounts((prev) => {
        const next = new Set(prev);
        next.delete(accountId);
        return next;
      });
    }
  };

  const accounts = status?.accounts || [];

  return (
    <div>
      <h3 className="text-sm font-semibold text-[var(--foreground)] mb-2">
        Connected Accounts
      </h3>
      <p className="text-sm text-[var(--muted-foreground)] mb-3">
        Connect one or more Zoom accounts to sync Team Chat messages via API polling.
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
        <div className="space-y-4">
          {accounts.length > 0 ? (
            accounts.map((account) => (
              <div
                key={account.id}
                className="p-4 rounded-lg border border-[var(--border)] bg-[var(--secondary)]"
              >
                <div className="flex items-center gap-2 mb-3">
                  <div
                    className={`w-2.5 h-2.5 rounded-full ${
                      account.isExpired ? "bg-amber-500" : "bg-green-500"
                    }`}
                  />
                  <span className="text-sm font-medium text-[var(--foreground)]">
                    {account.zoomEmail}
                  </span>
                  {account.isExpired && (
                    <span className="text-xs text-amber-500">(token expired, will auto-refresh)</span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                  <div>
                    <span className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">
                      Connected Since
                    </span>
                    <p className="text-[var(--foreground)] mt-0.5">
                      {new Date(account.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">
                      Last Sync
                    </span>
                    <p className="text-[var(--foreground)] mt-0.5">
                      {account.lastSyncAt
                        ? new Date(account.lastSyncAt).toLocaleString()
                        : "Never"}
                    </p>
                  </div>
                </div>

                {syncResults[account.id] && (
                  <div className="mb-3 p-2 rounded bg-blue-500/10 border border-blue-500/20 text-xs text-[var(--foreground)]">
                    Fetched {syncResults[account.id].total} messages: {syncResults[account.id].inserted} new, {syncResults[account.id].skipped} already existed.
                  </div>
                )}

                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => handleSync(account.id)}
                    disabled={syncingAccounts.has(account.id)}
                    className="px-3 py-1.5 text-xs font-medium rounded-md bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    {syncingAccounts.has(account.id) ? "Syncing..." : "Sync Now"}
                  </button>
                  <button
                    onClick={() => handleDisconnect(account.id)}
                    disabled={disconnectingAccounts.has(account.id)}
                    className="px-3 py-1.5 text-xs font-medium rounded-md border border-red-500/30 text-red-600 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                  >
                    {disconnectingAccounts.has(account.id) ? "Disconnecting..." : "Disconnect"}
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="p-4 rounded-lg border border-[var(--border)] bg-[var(--secondary)]">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2.5 h-2.5 rounded-full bg-gray-400" />
                <span className="text-sm font-medium text-[var(--muted-foreground)]">
                  No Accounts Connected
                </span>
              </div>
              <p className="text-sm text-[var(--muted-foreground)]">
                Connect your Zoom account to start syncing chat messages.
                You will be redirected to Zoom to authorize the app.
              </p>
            </div>
          )}

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

interface GoogleAccountInfo {
  id: string;
  googleEmail: string;
  tokenExpiry: string;
  isExpired: boolean;
  lastSyncAt: string | null;
  createdAt: string;
  updatedAt: string;
}

function GoogleCalendarIntegrationManager() {
  const [status, setStatus] = useState<{
    connected: boolean;
    accounts: GoogleAccountInfo[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [calendarSyncingAccounts, setCalendarSyncingAccounts] = useState<Set<string>>(new Set());
  const [disconnectingAccounts, setDisconnectingAccounts] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [calendarSyncResults, setCalendarSyncResults] = useState<Record<string, {
    synced: number;
    errors: number;
  }>>({});

  const fetchStatus = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/google/oauth");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setStatus(data);
    } catch {
      setError("Failed to load Google connection status");
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
    if (params.get("google_connected") === "true") {
      setSuccess("Google account connected successfully!");
      setTimeout(() => setSuccess(null), 5000);
      fetchStatus();
      const url = new URL(window.location.href);
      url.searchParams.delete("google_connected");
      url.hash = "googlecalendar";
      window.history.replaceState({}, "", url.toString());
    }
    if (params.get("google_error")) {
      setError(`Google connection failed: ${params.get("google_error")}`);
      const url = new URL(window.location.href);
      url.searchParams.delete("google_error");
      url.hash = "googlecalendar";
      window.history.replaceState({}, "", url.toString());
    }
  }, [fetchStatus]);

  const handleConnect = () => {
    window.location.href = "/api/google/oauth?action=connect";
  };

  const handleDisconnect = async (accountId: string) => {
    setDisconnectingAccounts((prev) => new Set(prev).add(accountId));
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`/api/google/oauth?accountId=${accountId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to disconnect");
      setSuccess("Google account disconnected");
      setTimeout(() => setSuccess(null), 5000);
      await fetchStatus();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to disconnect Google"
      );
    } finally {
      setDisconnectingAccounts((prev) => {
        const next = new Set(prev);
        next.delete(accountId);
        return next;
      });
    }
  };

  const handleCalendarSync = async (accountId: string) => {
    setCalendarSyncingAccounts((prev) => new Set(prev).add(accountId));
    setError(null);
    setCalendarSyncResults((prev) => {
      const next = { ...prev };
      delete next[accountId];
      return next;
    });
    try {
      const res = await fetch("/api/google/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountId, daysBack: 7, daysForward: 30 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Calendar sync failed");
      setCalendarSyncResults((prev) => ({
        ...prev,
        [accountId]: { synced: data.synced, errors: data.errors },
      }));
      setSuccess(`Calendar sync complete: ${data.synced} events synced`);
      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Calendar sync failed");
    } finally {
      setCalendarSyncingAccounts((prev) => {
        const next = new Set(prev);
        next.delete(accountId);
        return next;
      });
    }
  };

  const accounts = status?.accounts || [];

  return (
    <div>
      <h3 className="text-sm font-semibold text-[var(--foreground)] mb-2">
        Connected Accounts
      </h3>
      <p className="text-sm text-[var(--muted-foreground)] mb-3">
        Connect one or more Google accounts to sync calendar events. Only read-only
        calendar access is requested.
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
        <div className="space-y-4">
          {accounts.length > 0 ? (
            accounts.map((account) => (
              <div
                key={account.id}
                className="p-4 rounded-lg border border-[var(--border)] bg-[var(--secondary)]"
              >
                <div className="flex items-center gap-2 mb-3">
                  <div
                    className={`w-2.5 h-2.5 rounded-full ${
                      account.isExpired ? "bg-amber-500" : "bg-green-500"
                    }`}
                  />
                  <span className="text-sm font-medium text-[var(--foreground)]">
                    {account.googleEmail}
                  </span>
                  {account.isExpired && (
                    <span className="text-xs text-amber-500">(token expired, will auto-refresh)</span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                  <div>
                    <span className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">
                      Connected Since
                    </span>
                    <p className="text-[var(--foreground)] mt-0.5">
                      {new Date(account.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">
                      Last Sync
                    </span>
                    <p className="text-[var(--foreground)] mt-0.5">
                      {account.lastSyncAt
                        ? new Date(account.lastSyncAt).toLocaleString()
                        : "Never"}
                    </p>
                  </div>
                </div>

                {calendarSyncResults[account.id] && (
                  <div className="mb-3 p-2 rounded bg-blue-500/10 border border-blue-500/20 text-xs text-[var(--foreground)]">
                    Calendar: {calendarSyncResults[account.id].synced} events synced.
                    {calendarSyncResults[account.id].errors > 0 && ` (${calendarSyncResults[account.id].errors} errors)`}
                  </div>
                )}

                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => handleCalendarSync(account.id)}
                    disabled={calendarSyncingAccounts.has(account.id)}
                    className="px-3 py-1.5 text-xs font-medium rounded-md bg-[#4285F4] text-white hover:bg-[#3367D6] transition-colors disabled:opacity-50"
                  >
                    {calendarSyncingAccounts.has(account.id) ? "Syncing..." : "Sync Calendar"}
                  </button>
                  <button
                    onClick={() => handleDisconnect(account.id)}
                    disabled={disconnectingAccounts.has(account.id)}
                    className="px-3 py-1.5 text-xs font-medium rounded-md border border-red-500/30 text-red-600 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                  >
                    {disconnectingAccounts.has(account.id) ? "Disconnecting..." : "Disconnect"}
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="p-4 rounded-lg border border-[var(--border)] bg-[var(--secondary)]">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2.5 h-2.5 rounded-full bg-gray-400" />
                <span className="text-sm font-medium text-[var(--muted-foreground)]">
                  No Accounts Connected
                </span>
              </div>
              <p className="text-sm text-[var(--muted-foreground)]">
                Connect your Google account to start syncing calendar events.
                You will be redirected to Google to authorize the app.
              </p>
            </div>
          )}

          <button
            onClick={handleConnect}
            className="px-4 py-2 text-sm font-medium rounded-md bg-[#4285F4] text-white hover:bg-[#3367D6] transition-colors"
          >
            {accounts.length > 0 ? "Add Another Account" : "Connect Google Account"}
          </button>
        </div>
      )}
    </div>
  );
}

interface OutlookAccountInfo {
  id: string;
  outlookEmail: string;
  tokenExpiry: string;
  isExpired: boolean;
  lastSyncAt: string | null;
  emailActionBoardId: string | null;
  createdAt: string;
  updatedAt: string;
}

function OutlookIntegrationManager() {
  const [status, setStatus] = useState<{
    connected: boolean;
    accounts: OutlookAccountInfo[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncingAccounts, setSyncingAccounts] = useState<Set<string>>(new Set());
  const [calendarSyncingAccounts, setCalendarSyncingAccounts] = useState<Set<string>>(new Set());
  const [disconnectingAccounts, setDisconnectingAccounts] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [syncResults, setSyncResults] = useState<Record<string, {
    total: number;
    inserted: number;
    skipped: number;
  }>>({});
  const [calendarSyncResults, setCalendarSyncResults] = useState<Record<string, {
    synced: number;
    errors: number;
  }>>({});
  const [boards, setBoards] = useState<{ id: string; title: string }[]>([]);
  const [savingBoard, setSavingBoard] = useState<Record<string, boolean>>({});

  const fetchStatus = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [res, boardsRes] = await Promise.all([
        fetch("/api/outlook/oauth"),
        fetch("/api/v1/boards"),
      ]);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setStatus(data);
      if (boardsRes.ok) {
        const boardsData = await boardsRes.json();
        setBoards(boardsData.map((b: { id: string; title: string }) => ({ id: b.id, title: b.title })));
      }
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
      setSuccess("Outlook account connected successfully!");
      setTimeout(() => setSuccess(null), 5000);
      fetchStatus();
      const url = new URL(window.location.href);
      url.searchParams.delete("outlook_connected");
      url.hash = "outlook";
      window.history.replaceState({}, "", url.toString());
    }
    if (params.get("outlook_error")) {
      setError(`Outlook connection failed: ${params.get("outlook_error")}`);
      const url = new URL(window.location.href);
      url.searchParams.delete("outlook_error");
      url.hash = "outlook";
      window.history.replaceState({}, "", url.toString());
    }
  }, [fetchStatus]);

  const handleConnect = () => {
    window.location.href = "/api/outlook/oauth?action=connect";
  };

  const handleDisconnect = async (accountId: string) => {
    setDisconnectingAccounts((prev) => new Set(prev).add(accountId));
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`/api/outlook/oauth?accountId=${accountId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to disconnect");
      setSuccess("Outlook account disconnected");
      setTimeout(() => setSuccess(null), 5000);
      await fetchStatus();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to disconnect Outlook"
      );
    } finally {
      setDisconnectingAccounts((prev) => {
        const next = new Set(prev);
        next.delete(accountId);
        return next;
      });
    }
  };

  const handleSync = async (accountId: string) => {
    setSyncingAccounts((prev) => new Set(prev).add(accountId));
    setError(null);
    setSyncResults((prev) => {
      const next = { ...prev };
      delete next[accountId];
      return next;
    });
    try {
      const res = await fetch("/api/outlook/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Sync failed");
      setSyncResults((prev) => ({
        ...prev,
        [accountId]: { total: data.total, inserted: data.inserted, skipped: data.skipped },
      }));
      setSuccess(`Sync complete: ${data.inserted} new emails imported`);
      setTimeout(() => setSuccess(null), 5000);
      await fetchStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sync failed");
    } finally {
      setSyncingAccounts((prev) => {
        const next = new Set(prev);
        next.delete(accountId);
        return next;
      });
    }
  };

  const handleCalendarSync = async (accountId: string) => {
    setCalendarSyncingAccounts((prev) => new Set(prev).add(accountId));
    setError(null);
    setCalendarSyncResults((prev) => {
      const next = { ...prev };
      delete next[accountId];
      return next;
    });
    try {
      const res = await fetch("/api/outlook/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountId, daysBack: 7, daysForward: 30 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Calendar sync failed");
      setCalendarSyncResults((prev) => ({
        ...prev,
        [accountId]: { synced: data.synced, errors: data.errors },
      }));
      setSuccess(`Calendar sync complete: ${data.synced} events synced`);
      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Calendar sync failed");
    } finally {
      setCalendarSyncingAccounts((prev) => {
        const next = new Set(prev);
        next.delete(accountId);
        return next;
      });
    }
  };

  const handleBoardChange = async (accountId: string, boardId: string | null) => {
    setSavingBoard((prev) => ({ ...prev, [accountId]: true }));
    try {
      const res = await fetch(`/api/outlook/accounts/${accountId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailActionBoardId: boardId }),
      });
      if (!res.ok) throw new Error("Failed to save");
      setStatus((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          accounts: prev.accounts.map((a) =>
            a.id === accountId ? { ...a, emailActionBoardId: boardId } : a
          ),
        };
      });
      setSuccess("Auto-ticket board updated");
      setTimeout(() => setSuccess(null), 3000);
    } catch {
      setError("Failed to update board setting");
    } finally {
      setSavingBoard((prev) => ({ ...prev, [accountId]: false }));
    }
  };

  const accounts = status?.accounts || [];

  return (
    <div>
      <h3 className="text-sm font-semibold text-[var(--foreground)] mb-2">
        Connected Accounts
      </h3>
      <p className="text-sm text-[var(--muted-foreground)] mb-3">
        Connect one or more Microsoft accounts (Outlook.com, Hotmail, Live, Office 365) to
        sync emails and calendar events using delegated OAuth permissions.
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
        <div className="space-y-4">
          {accounts.length > 0 ? (
            accounts.map((account) => (
              <div
                key={account.id}
                className="p-4 rounded-lg border border-[var(--border)] bg-[var(--secondary)]"
              >
                <div className="flex items-center gap-2 mb-3">
                  <div
                    className={`w-2.5 h-2.5 rounded-full ${
                      account.isExpired ? "bg-amber-500" : "bg-green-500"
                    }`}
                  />
                  <span className="text-sm font-medium text-[var(--foreground)]">
                    {account.outlookEmail}
                  </span>
                  {account.isExpired && (
                    <span className="text-xs text-amber-500">(token expired, will auto-refresh)</span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                  <div>
                    <span className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">
                      Connected Since
                    </span>
                    <p className="text-[var(--foreground)] mt-0.5">
                      {new Date(account.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">
                      Last Sync
                    </span>
                    <p className="text-[var(--foreground)] mt-0.5">
                      {account.lastSyncAt
                        ? new Date(account.lastSyncAt).toLocaleString()
                        : "Never"}
                    </p>
                  </div>
                </div>

                {syncResults[account.id] && (
                  <div className="mb-3 p-2 rounded bg-blue-500/10 border border-blue-500/20 text-xs text-[var(--foreground)]">
                    Fetched {syncResults[account.id].total} messages: {syncResults[account.id].inserted} new, {syncResults[account.id].skipped} already existed.
                  </div>
                )}

                {calendarSyncResults[account.id] && (
                  <div className="mb-3 p-2 rounded bg-blue-500/10 border border-blue-500/20 text-xs text-[var(--foreground)]">
                    Calendar: {calendarSyncResults[account.id].synced} events synced.
                    {calendarSyncResults[account.id].errors > 0 && ` (${calendarSyncResults[account.id].errors} errors)`}
                  </div>
                )}

                {/* Per-account Kanban board selector */}
                <div className="mb-3">
                  <label className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">
                    Auto-Create Kanban Tickets
                  </label>
                  <div className="mt-1 flex items-center gap-2">
                    <select
                      value={account.emailActionBoardId ?? ""}
                      onChange={(e) => handleBoardChange(account.id, e.target.value || null)}
                      disabled={savingBoard[account.id]}
                      className="flex-1 px-2 py-1.5 text-xs rounded-md border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] disabled:opacity-50"
                    >
                      <option value="">-- Disabled --</option>
                      {boards.map((board) => (
                        <option key={board.id} value={board.id}>
                          {board.title}
                        </option>
                      ))}
                    </select>
                    {savingBoard[account.id] && (
                      <span className="text-xs text-[var(--muted-foreground)]">Saving...</span>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => handleSync(account.id)}
                    disabled={syncingAccounts.has(account.id)}
                    className="px-3 py-1.5 text-xs font-medium rounded-md bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    {syncingAccounts.has(account.id) ? "Syncing..." : "Sync Emails"}
                  </button>
                  <button
                    onClick={() => handleCalendarSync(account.id)}
                    disabled={calendarSyncingAccounts.has(account.id)}
                    className="px-3 py-1.5 text-xs font-medium rounded-md bg-[#0078D4] text-white hover:bg-[#106ebe] transition-colors disabled:opacity-50"
                  >
                    {calendarSyncingAccounts.has(account.id) ? "Syncing..." : "Sync Calendar"}
                  </button>
                  <button
                    onClick={() => handleDisconnect(account.id)}
                    disabled={disconnectingAccounts.has(account.id)}
                    className="px-3 py-1.5 text-xs font-medium rounded-md border border-red-500/30 text-red-600 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                  >
                    {disconnectingAccounts.has(account.id) ? "Disconnecting..." : "Disconnect"}
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="p-4 rounded-lg border border-[var(--border)] bg-[var(--secondary)]">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2.5 h-2.5 rounded-full bg-gray-400" />
                <span className="text-sm font-medium text-[var(--muted-foreground)]">
                  No Accounts Connected
                </span>
              </div>
              <p className="text-sm text-[var(--muted-foreground)]">
                Connect your Outlook account to start importing emails and
                syncing calendar events. You will be redirected to Microsoft to
                authorize the app.
              </p>
            </div>
          )}

          <button
            onClick={handleConnect}
            className="px-4 py-2 text-sm font-medium rounded-md bg-[#0078D4] text-white hover:bg-[#106ebe] transition-colors"
          >
            {accounts.length > 0 ? "Add Another Account" : "Connect Outlook Account"}
          </button>
        </div>
      )}
    </div>
  );
}

export function IntegrationsClient({ tenantId }: { tenantId: string }) {
  const [activeTab, setActiveTabRaw] = useState<TabId>(() => {
    if (typeof window !== "undefined") {
      // Restore tab from hash
      const hash = window.location.hash.replace("#", "");
      const tab = TABS.find((t) => t.id === hash);
      if (tab) return tab.id;

      // Auto-select tab based on OAuth callback params
      const params = new URLSearchParams(window.location.search);
      if (params.has("gmail_connected") || params.has("gmail_error")) return "gmail";
      if (params.has("outlook_connected") || params.has("outlook_error")) return "outlook";
      if (params.has("zoom_connected") || params.has("zoom_error")) return "zoom";
      if (params.has("google_connected") || params.has("google_error")) return "googlecalendar";
    }
    return "microsoft365";
  });

  const setActiveTab = useCallback((tab: TabId) => {
    setActiveTabRaw(tab);
    window.history.replaceState(null, "", `#${tab}`);
  }, []);
  const [graphCredentials, setGraphCredentials] = useState<GraphCredential[]>([]);
  const origin = typeof window !== "undefined" ? window.location.origin : "https://your-domain.com";
  const webhookUrl = `${origin}/api/webhooks/email/microsoft365/${tenantId}`;
  const graphWebhookUrl = `${origin}/api/webhooks/email/graph/${tenantId}`;

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
                    Connect your Gmail account via OAuth to monitor your inbox
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Gmail Watch Manager — the primary UX */}
              <GmailWatchManager />

              <p className="text-sm text-[var(--muted-foreground)]">
                Clicking <span className="font-medium text-[var(--foreground)]">Connect Gmail</span> will
                open Google&apos;s sign-in page where you grant read-only access to your inbox.
                We&apos;ll automatically set up real-time notifications so new emails appear here
                within seconds. The connection renews every 7 days &mdash; you&apos;ll see a reminder
                when it&apos;s time.
              </p>
            </div>
          </section>}

          {/* Google Calendar Section */}
          {activeTab === "googlecalendar" && <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
            <div className="px-6 py-5 border-b border-[var(--border)]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#4285F4] flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                    <path d="M19.5 3h-3V1.5h-1.5V3h-6V1.5H7.5V3h-3C3.67 3 3 3.67 3 4.5v15c0 .83.67 1.5 1.5 1.5h15c.83 0 1.5-.67 1.5-1.5v-15c0-.83-.67-1.5-1.5-1.5zm0 16.5h-15V8h15v11.5zM7.5 10h3v3h-3v-3zm4.5 0h3v3h-3v-3zm4.5 0h3v3h-3v-3z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-[var(--foreground)]">
                    Google Calendar
                  </h2>
                  <p className="text-sm text-[var(--muted-foreground)]">
                    Sync calendar events from Google Calendar via OAuth
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-8">
              {/* Description */}
              <div>
                <p className="text-sm text-[var(--muted-foreground)]">
                  Connect your Google account to sync calendar events from your primary Google Calendar.
                  Events appear in the Calendar widget and can be correlated with Krisp meetings by
                  timestamp overlap. Supports multiple connected Google accounts.
                </p>
              </div>

              {/* OAuth Connection */}
              <div>
                <GoogleCalendarIntegrationManager />
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
                          You sign in with your Google account and consent to share your calendar.
                          OAuth tokens are stored securely.
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 font-medium text-[var(--foreground)]">
                          Calendar Sync
                        </td>
                        <td className="px-4 py-3 text-[var(--muted-foreground)]">
                          Click &quot;Sync Calendar&quot; to pull events from the past 7 days to 30 days ahead.
                          Events are deduplicated and updated on each sync. Meet links are automatically extracted.
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
                    <span className="font-medium">Pull-based sync:</span> This integration requires
                    manual syncs via the &quot;Sync Calendar&quot; button or the Calendar page Sync button.
                  </div>
                  <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-sm text-[var(--foreground)]">
                    <span className="font-medium">Read-only access:</span> The integration uses the
                    <code className="px-1 py-0.5 rounded bg-[var(--secondary)] text-xs mx-1">calendar.readonly</code>
                    scope. It can only read your calendar events, never modify them.
                  </div>
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
                    Microsoft Outlook
                  </h2>
                  <p className="text-sm text-[var(--muted-foreground)]">
                    Sync emails and calendar from Microsoft accounts via OAuth
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-8">
              {/* Description */}
              <div>
                <p className="text-sm text-[var(--muted-foreground)]">
                  This integration connects to any Microsoft account — personal (Outlook.com, Hotmail, Live.com)
                  or work/school (Office 365, Exchange Online) — using the Microsoft identity platform v2.0
                  with delegated OAuth permissions and the authorization code flow. It supports
                  both email sync and calendar sync.
                </p>
              </div>

              {/* OAuth Connection */}
              <div>
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
                          Email Sync
                        </td>
                        <td className="px-4 py-3 text-[var(--muted-foreground)]">
                          Click &quot;Sync Emails Now&quot; to pull recent inbox messages. The system
                          deduplicates and only imports new emails.
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 font-medium text-[var(--foreground)]">
                          Calendar Sync
                        </td>
                        <td className="px-4 py-3 text-[var(--muted-foreground)]">
                          Click &quot;Sync Calendar Now&quot; to pull calendar events from the past
                          7 days to 30 days ahead. Events are deduplicated and updated on each sync.
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
                    scheduled syncs via the &quot;Sync Emails Now&quot; and &quot;Sync Calendar Now&quot; buttons.
                  </div>
                  <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-sm text-[var(--foreground)]">
                    <span className="font-medium">Calendar scope:</span> Calendar sync
                    uses the <code className="px-1 py-0.5 rounded bg-[var(--secondary)] text-xs">Calendars.Read</code> permission.
                    If you connected before this feature was added, disconnect and reconnect to
                    grant the new permission.
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

          {/* Telegram Section */}
          {activeTab === "telegram" && <TelegramSection />}

          {/* Outbound Webhooks Section */}
          {activeTab === "outbound" && <OutboundWebhooksSection />}

          {/* Zapier Section */}
          {activeTab === "zapier" && <ZapierSection tenantId={tenantId} />}
        </div>
      </main>
    </div>
  );
}

// ── Telegram Integration Section ─────────────────────────────────
function TelegramSection() {
  const [status, setStatus] = useState<{
    connected: boolean;
    botUsername?: string;
    chatId?: string;
    active?: boolean;
    webhook?: {
      url?: string;
      pendingUpdates?: number;
      lastError?: string;
      lastErrorDate?: string;
    };
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [botToken, setBotToken] = useState("");
  const [saving, setSaving] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/telegram");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setStatus(data);
    } catch {
      setError("Failed to load Telegram status");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const handleConnect = async () => {
    if (!botToken.trim()) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch("/api/telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ botToken: botToken.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to connect bot");
        return;
      }
      setBotToken("");
      setSuccess(`Connected to @${data.botUsername}`);
      setTimeout(() => setSuccess(null), 4000);
      await fetchStatus();
    } catch {
      setError("Failed to connect Telegram bot");
    } finally {
      setSaving(false);
    }
  };

  const handleDisconnect = async () => {
    setDisconnecting(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch("/api/telegram", { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      setSuccess("Telegram bot disconnected");
      setTimeout(() => setSuccess(null), 4000);
      await fetchStatus();
    } catch {
      setError("Failed to disconnect Telegram bot");
    } finally {
      setDisconnecting(false);
    }
  };

  return (
    <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
      <div className="px-6 py-5 border-b border-[var(--border)]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#0088CC] flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
              <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[var(--foreground)]">
              Telegram Bot
            </h2>
            <p className="text-sm text-[var(--muted-foreground)]">
              Chat with your Second Brain AI via Telegram
            </p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-8">
        {/* Description */}
        <div>
          <p className="text-sm text-[var(--muted-foreground)]">
            Connect a Telegram bot to chat with your Brain AI from anywhere. The
            bot has access to the same meetings, emails, decisions, and action items
            as the web-based Brain Chat. Messages sent via Telegram are processed
            through the same AI and stored in your Brain conversation history.
          </p>
        </div>

        {/* Status / Error / Success messages */}
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

        {loading ? (
          <div className="py-8 text-center text-sm text-[var(--muted-foreground)]">
            Loading...
          </div>
        ) : status?.connected ? (
          /* Connected state */
          <div className="space-y-6">
            <div className="p-4 rounded-lg bg-green-500/5 border border-green-500/20">
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-[var(--foreground)]">
                    Connected to{" "}
                    <span className="font-semibold text-[#0088CC]">
                      @{status.botUsername}
                    </span>
                  </p>
                  {status.chatId ? (
                    <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                      Chat linked (ID: {status.chatId})
                    </p>
                  ) : (
                    <p className="text-xs text-amber-600 mt-0.5">
                      Send /start to your bot on Telegram to link the chat
                    </p>
                  )}
                </div>
                <button
                  onClick={handleDisconnect}
                  disabled={disconnecting}
                  className="px-3 py-1.5 text-xs font-medium rounded-md border border-red-300 text-red-600 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
                >
                  {disconnecting ? "Disconnecting..." : "Disconnect"}
                </button>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-[var(--secondary)] border border-[var(--border)]">
              <h4 className="text-sm font-medium text-[var(--foreground)] mb-2">
                How to use
              </h4>
              <ol className="text-sm text-[var(--muted-foreground)] space-y-1.5 list-decimal list-inside">
                <li>
                  Open Telegram and search for{" "}
                  <span className="font-medium text-[var(--foreground)]">
                    @{status.botUsername}
                  </span>
                </li>
                <li>Send <code className="px-1 py-0.5 rounded bg-[var(--accent)] text-xs">/start</code> to begin</li>
                <li>Type any question to query your Second Brain</li>
              </ol>
            </div>

            {/* Webhook Debug Info */}
            {status.webhook && (
              <div className="p-4 rounded-lg bg-[var(--secondary)] border border-[var(--border)]">
                <h4 className="text-sm font-medium text-[var(--foreground)] mb-2">
                  Webhook Status
                </h4>
                <div className="text-xs text-[var(--muted-foreground)] space-y-1 font-mono">
                  <p>URL: {status.webhook.url || "(not set)"}</p>
                  <p>Pending updates: {status.webhook.pendingUpdates ?? 0}</p>
                  {status.webhook.lastError && (
                    <p className="text-red-500">
                      Last error: {status.webhook.lastError}
                      {status.webhook.lastErrorDate && (
                        <> ({new Date(status.webhook.lastErrorDate).toLocaleString()})</>
                      )}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Disconnected state - setup form */
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-[var(--foreground)] mb-2">
                Connect Your Bot
              </h3>
              <p className="text-sm text-[var(--muted-foreground)] mb-4">
                Enter your Telegram bot token to connect. The webhook will be
                automatically registered.
              </p>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={botToken}
                  onChange={(e) => setBotToken(e.target.value)}
                  placeholder="123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
                  className="flex-1 px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:border-[var(--primary)] focus:outline-none"
                />
                <button
                  onClick={handleConnect}
                  disabled={!botToken.trim() || saving}
                  className="px-4 py-2 text-sm font-medium rounded-lg bg-[var(--primary)] text-white hover:opacity-90 transition-colors disabled:opacity-50"
                >
                  {saving ? "Connecting..." : "Connect"}
                </button>
              </div>
            </div>

            {/* Setup guide */}
            <div>
              <h3 className="text-sm font-semibold text-[var(--foreground)] mb-4">
                Setup Guide
              </h3>
              <ol className="space-y-5">
                <li className="flex gap-4">
                  <span className="flex-shrink-0 w-7 h-7 rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] flex items-center justify-center text-sm font-semibold">
                    1
                  </span>
                  <div className="flex-1">
                    <p className="font-medium text-[var(--foreground)]">
                      Create a Telegram Bot
                    </p>
                    <p className="text-sm text-[var(--muted-foreground)] mt-1">
                      Open Telegram and message{" "}
                      <span className="font-medium text-[#0088CC]">@BotFather</span>.
                      Send <code className="px-1 py-0.5 rounded bg-[var(--secondary)] text-xs">/newbot</code>{" "}
                      and follow the prompts to create a new bot.
                    </p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <span className="flex-shrink-0 w-7 h-7 rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] flex items-center justify-center text-sm font-semibold">
                    2
                  </span>
                  <div className="flex-1">
                    <p className="font-medium text-[var(--foreground)]">
                      Copy the Bot Token
                    </p>
                    <p className="text-sm text-[var(--muted-foreground)] mt-1">
                      BotFather will give you a token that looks like{" "}
                      <code className="px-1 py-0.5 rounded bg-[var(--secondary)] text-xs">
                        123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11
                      </code>
                      . Copy this token.
                    </p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <span className="flex-shrink-0 w-7 h-7 rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] flex items-center justify-center text-sm font-semibold">
                    3
                  </span>
                  <div className="flex-1">
                    <p className="font-medium text-[var(--foreground)]">
                      Paste Token Above
                    </p>
                    <p className="text-sm text-[var(--muted-foreground)] mt-1">
                      Paste the bot token into the field above and click{" "}
                      <span className="font-medium text-[var(--foreground)]">Connect</span>.
                      The webhook will be registered automatically.
                    </p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <span className="flex-shrink-0 w-7 h-7 rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] flex items-center justify-center text-sm font-semibold">
                    4
                  </span>
                  <div className="flex-1">
                    <p className="font-medium text-[var(--foreground)]">
                      Start Chatting
                    </p>
                    <p className="text-sm text-[var(--muted-foreground)] mt-1">
                      Open your bot in Telegram and send{" "}
                      <code className="px-1 py-0.5 rounded bg-[var(--secondary)] text-xs">/start</code>
                      . Then start asking questions about your meetings, emails,
                      and action items.
                    </p>
                  </div>
                </li>
              </ol>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

// ── Outbound Webhooks Section ─────────────────────────────────
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

function OutboundWebhooksSection() {
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

  return (
    <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
      <div className="px-6 py-5 border-b border-[var(--border)]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-500 flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 2 11 13" />
              <path d="m22 2-7 20-4-9-9-4 20-7z" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[var(--foreground)]">
              Outbound Webhooks
            </h2>
            <p className="text-sm text-[var(--muted-foreground)]">
              Send event notifications to Zapier, Make, or custom endpoints
            </p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
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
    </section>
  );
}

// ── Zapier Integration Section ──────────────────────────────────
interface IngestLog {
  id: string;
  source: string;
  routingTarget: string;
  status: "success" | "failed";
  errorMessage: string | null;
  thoughtId: string | null;
  cardId: string | null;
  createdAt: string;
}

function ZapierSection({ tenantId }: { tenantId: string }) {
  const [secret, setSecret] = useState<string | null>(null);
  const [fullSecret, setFullSecret] = useState<string | null>(null);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [logs, setLogs] = useState<IngestLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(true);
  const [showPayloadGuide, setShowPayloadGuide] = useState(false);

  const origin =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://your-domain.com";

  const fetchSecret = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/integrations/zapier/secret");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setSecret(data.secret);
      setWebhookUrl(
        data.webhookUrl ||
          `${origin}/api/integrations/zapier/ingest?user_id=${tenantId}`
      );
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [origin, tenantId]);

  const fetchLogs = useCallback(async () => {
    try {
      setLogsLoading(true);
      const res = await fetch("/api/integrations/zapier/logs?limit=20");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setLogs(data.data ?? []);
    } catch {
      // ignore
    } finally {
      setLogsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSecret();
    fetchLogs();
  }, [fetchSecret, fetchLogs]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await fetch("/api/integrations/zapier/secret", {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to generate");
      const data = await res.json();
      setFullSecret(data.secret);
      setSecret(
        data.secret.slice(0, 8) + "..." + data.secret.slice(-4)
      );
      setWebhookUrl(
        data.webhookUrl ||
          `${origin}/api/integrations/zapier/ingest?user_id=${tenantId}`
      );
    } catch {
      // ignore
    } finally {
      setGenerating(false);
    }
  };

  const handleRevoke = async () => {
    try {
      await fetch("/api/integrations/zapier/secret", { method: "DELETE" });
      setSecret(null);
      setFullSecret(null);
    } catch {
      // ignore
    }
  };

  const samplePayload = JSON.stringify(
    {
      message:
        "Team standup: decided to prioritize the mobile app redesign for Q2.",
      source: "Slack",
      author: "Jane Smith",
      timestamp: new Date().toISOString(),
      tags: ["standup", "mobile"],
      routing_target: "both",
      title: "Prioritize mobile app redesign",
      priority: "high",
      idempotency_key: "slack-msg-12345",
    },
    null,
    2
  );

  return (
    <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
      <div className="px-6 py-5 border-b border-[var(--border)]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#FF4A00] flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
              <path d="M15.637 8.363l-3.26 3.26a2.862 2.862 0 01-.06 1.158 2.862 2.862 0 01-1.158.06l-3.26 3.26a.5.5 0 00.707.707l3.26-3.26a2.862 2.862 0 01.06-1.158 2.862 2.862 0 011.158-.06l3.26-3.26a.5.5 0 00-.707-.707zM12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 18c-4.418 0-8-3.582-8-8s3.582-8 8-8 8 3.582 8 8-3.582 8-8 8z" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[var(--foreground)]">
              Zapier Integration
            </h2>
            <p className="text-sm text-[var(--muted-foreground)]">
              Push messages from any app into Brain memory or Kanban via Zapier
              webhooks
            </p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-8">
        {/* Webhook URL & Secret */}
        <div>
          <h3 className="text-sm font-semibold text-[var(--foreground)] mb-2">
            Webhook URL
          </h3>
          <p className="text-sm text-[var(--muted-foreground)] mb-3">
            Use this URL as the &ldquo;Webhooks by Zapier&rdquo; POST action
            URL.
          </p>
          {loading ? (
            <div className="h-10 bg-[var(--secondary)] rounded animate-pulse" />
          ) : (
            <div className="flex items-center gap-2">
              <code className="flex-1 px-3 py-2 text-sm bg-[var(--secondary)] border border-[var(--border)] rounded-lg break-all text-[var(--foreground)]">
                {webhookUrl}
              </code>
              <CopyButton text={webhookUrl} />
            </div>
          )}
        </div>

        <div>
          <h3 className="text-sm font-semibold text-[var(--foreground)] mb-2">
            Webhook Secret
          </h3>
          <p className="text-sm text-[var(--muted-foreground)] mb-3">
            Include this token as a{" "}
            <code className="text-xs bg-[var(--secondary)] px-1 py-0.5 rounded">
              Bearer
            </code>{" "}
            token in the Authorization header.
          </p>

          {loading ? (
            <div className="h-10 bg-[var(--secondary)] rounded animate-pulse" />
          ) : secret ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <code className="flex-1 px-3 py-2 text-sm bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)]">
                  {fullSecret || secret}
                </code>
                {fullSecret && <CopyButton text={fullSecret} />}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleGenerate}
                  disabled={generating}
                  className="px-4 py-2 text-sm font-medium rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] hover:bg-[var(--accent)] transition-colors disabled:opacity-50"
                >
                  {generating ? "Regenerating..." : "Regenerate Secret"}
                </button>
                <button
                  onClick={handleRevoke}
                  className="px-4 py-2 text-sm font-medium rounded-lg border border-red-300 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20 transition-colors"
                >
                  Revoke
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-[#FF4A00] text-white hover:bg-[#E54400] transition-colors disabled:opacity-50"
            >
              {generating ? "Generating..." : "Generate Webhook Secret"}
            </button>
          )}
        </div>

        {/* Zapier Setup Instructions */}
        <div>
          <h3 className="text-sm font-semibold text-[var(--foreground)] mb-2">
            Zapier Setup
          </h3>
          <ol className="list-decimal list-inside space-y-2 text-sm text-[var(--muted-foreground)]">
            <li>Create a new Zap in Zapier</li>
            <li>
              Set your trigger (e.g., &ldquo;New Message in Channel&rdquo; for
              Slack)
            </li>
            <li>
              Add &ldquo;Webhooks by Zapier&rdquo; as the action and choose
              &ldquo;POST&rdquo;
            </li>
            <li>Set the URL to your webhook URL above</li>
            <li>
              Under Headers, add:{" "}
              <code className="bg-[var(--secondary)] px-1 py-0.5 rounded text-xs">
                Authorization: Bearer YOUR_SECRET
              </code>
            </li>
            <li>
              Set Payload Type to{" "}
              <code className="bg-[var(--secondary)] px-1 py-0.5 rounded text-xs">
                json
              </code>
            </li>
            <li>Map your Zap fields to the payload schema below</li>
          </ol>
        </div>

        {/* Payload Schema */}
        <div>
          <button
            onClick={() => setShowPayloadGuide(!showPayloadGuide)}
            className="flex items-center gap-2 text-sm font-semibold text-[var(--foreground)] mb-3 hover:text-[var(--primary)] transition-colors"
          >
            <span>
              {showPayloadGuide ? "Hide" : "Show"} Payload Schema & Examples
            </span>
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className={`transition-transform ${showPayloadGuide ? "rotate-180" : ""}`}
            >
              <path d="M3 4.5L6 7.5L9 4.5" />
            </svg>
          </button>

          {showPayloadGuide && (
            <div className="space-y-6">
              {/* Field mapping table */}
              <div>
                <h4 className="text-sm font-medium text-[var(--foreground)] mb-2">
                  Payload Fields
                </h4>
                <div className="overflow-x-auto rounded-lg border border-[var(--border)]">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-[var(--secondary)]">
                        <th className="px-4 py-2 text-left font-medium text-[var(--foreground)]">
                          Field
                        </th>
                        <th className="px-4 py-2 text-left font-medium text-[var(--foreground)]">
                          Required
                        </th>
                        <th className="px-4 py-2 text-left font-medium text-[var(--foreground)]">
                          Description
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)]">
                      {[
                        {
                          field: "message",
                          required: "Yes",
                          desc: "The message body / content to ingest",
                        },
                        {
                          field: "source",
                          required: "No",
                          desc: 'Source system name (e.g., "Slack", "Notion"). Defaults to "zapier"',
                        },
                        {
                          field: "author",
                          required: "No",
                          desc: "Author / sender name",
                        },
                        {
                          field: "timestamp",
                          required: "No",
                          desc: "ISO 8601 timestamp from source",
                        },
                        {
                          field: "tags",
                          required: "No",
                          desc: "Array of string tags (max 10)",
                        },
                        {
                          field: "routing_target",
                          required: "No",
                          desc: '"brain" (default), "kanban", or "both"',
                        },
                        {
                          field: "title",
                          required: "No",
                          desc: "Card title (kanban only; auto-derived from message if omitted)",
                        },
                        {
                          field: "priority",
                          required: "No",
                          desc: '"low", "medium" (default), "high", or "urgent"',
                        },
                        {
                          field: "target_column",
                          required: "No",
                          desc: "Kanban column name (defaults to first column)",
                        },
                        {
                          field: "target_board",
                          required: "No",
                          desc: "Kanban board name (defaults to your default board)",
                        },
                        {
                          field: "idempotency_key",
                          required: "No",
                          desc: "Unique key to prevent duplicate processing on retries",
                        },
                      ].map((row) => (
                        <tr
                          key={row.field}
                          className="hover:bg-[var(--accent)]/50"
                        >
                          <td className="px-4 py-2 font-mono text-xs text-[var(--foreground)]">
                            {row.field}
                          </td>
                          <td className="px-4 py-2 text-[var(--muted-foreground)]">
                            {row.required}
                          </td>
                          <td className="px-4 py-2 text-[var(--muted-foreground)]">
                            {row.desc}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Sample payload */}
              <div>
                <h4 className="text-sm font-medium text-[var(--foreground)] mb-2">
                  Sample Payload
                </h4>
                <CodeBlock>{samplePayload}</CodeBlock>
              </div>

              {/* Source app examples */}
              <div>
                <h4 className="text-sm font-medium text-[var(--foreground)] mb-2">
                  Field Mapping Examples
                </h4>
                <div className="space-y-4">
                  <div className="rounded-lg border border-[var(--border)] p-4">
                    <h5 className="text-sm font-semibold text-[var(--foreground)] mb-1">
                      Slack &rarr; Krisp
                    </h5>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-[var(--border)]">
                            <th className="px-3 py-1.5 text-left text-[var(--muted-foreground)]">
                              Slack Field
                            </th>
                            <th className="px-3 py-1.5 text-left text-[var(--muted-foreground)]">
                              Payload Key
                            </th>
                          </tr>
                        </thead>
                        <tbody className="text-[var(--foreground)]">
                          <tr>
                            <td className="px-3 py-1">Message Text</td>
                            <td className="px-3 py-1 font-mono text-xs">
                              message
                            </td>
                          </tr>
                          <tr>
                            <td className="px-3 py-1">Channel Name</td>
                            <td className="px-3 py-1 font-mono text-xs">
                              tags[0]
                            </td>
                          </tr>
                          <tr>
                            <td className="px-3 py-1">User Name</td>
                            <td className="px-3 py-1 font-mono text-xs">
                              author
                            </td>
                          </tr>
                          <tr>
                            <td className="px-3 py-1">Timestamp</td>
                            <td className="px-3 py-1 font-mono text-xs">
                              timestamp
                            </td>
                          </tr>
                          <tr>
                            <td className="px-3 py-1">
                              (static: &ldquo;Slack&rdquo;)
                            </td>
                            <td className="px-3 py-1 font-mono text-xs">
                              source
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="rounded-lg border border-[var(--border)] p-4">
                    <h5 className="text-sm font-semibold text-[var(--foreground)] mb-1">
                      Gmail &rarr; Krisp
                    </h5>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-[var(--border)]">
                            <th className="px-3 py-1.5 text-left text-[var(--muted-foreground)]">
                              Gmail Field
                            </th>
                            <th className="px-3 py-1.5 text-left text-[var(--muted-foreground)]">
                              Payload Key
                            </th>
                          </tr>
                        </thead>
                        <tbody className="text-[var(--foreground)]">
                          <tr>
                            <td className="px-3 py-1">Body Plain</td>
                            <td className="px-3 py-1 font-mono text-xs">
                              message
                            </td>
                          </tr>
                          <tr>
                            <td className="px-3 py-1">Subject</td>
                            <td className="px-3 py-1 font-mono text-xs">
                              title
                            </td>
                          </tr>
                          <tr>
                            <td className="px-3 py-1">From Email</td>
                            <td className="px-3 py-1 font-mono text-xs">
                              author
                            </td>
                          </tr>
                          <tr>
                            <td className="px-3 py-1">Date</td>
                            <td className="px-3 py-1 font-mono text-xs">
                              timestamp
                            </td>
                          </tr>
                          <tr>
                            <td className="px-3 py-1">
                              (static: &ldquo;Gmail&rdquo;)
                            </td>
                            <td className="px-3 py-1 font-mono text-xs">
                              source
                            </td>
                          </tr>
                          <tr>
                            <td className="px-3 py-1">Message ID</td>
                            <td className="px-3 py-1 font-mono text-xs">
                              idempotency_key
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="rounded-lg border border-[var(--border)] p-4">
                    <h5 className="text-sm font-semibold text-[var(--foreground)] mb-1">
                      Notion &rarr; Krisp
                    </h5>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-[var(--border)]">
                            <th className="px-3 py-1.5 text-left text-[var(--muted-foreground)]">
                              Notion Field
                            </th>
                            <th className="px-3 py-1.5 text-left text-[var(--muted-foreground)]">
                              Payload Key
                            </th>
                          </tr>
                        </thead>
                        <tbody className="text-[var(--foreground)]">
                          <tr>
                            <td className="px-3 py-1">
                              Page Content / Body
                            </td>
                            <td className="px-3 py-1 font-mono text-xs">
                              message
                            </td>
                          </tr>
                          <tr>
                            <td className="px-3 py-1">Page Title</td>
                            <td className="px-3 py-1 font-mono text-xs">
                              title
                            </td>
                          </tr>
                          <tr>
                            <td className="px-3 py-1">Last Edited By</td>
                            <td className="px-3 py-1 font-mono text-xs">
                              author
                            </td>
                          </tr>
                          <tr>
                            <td className="px-3 py-1">Last Edited Time</td>
                            <td className="px-3 py-1 font-mono text-xs">
                              timestamp
                            </td>
                          </tr>
                          <tr>
                            <td className="px-3 py-1">
                              (static: &ldquo;Notion&rdquo;)
                            </td>
                            <td className="px-3 py-1 font-mono text-xs">
                              source
                            </td>
                          </tr>
                          <tr>
                            <td className="px-3 py-1">Page ID</td>
                            <td className="px-3 py-1 font-mono text-xs">
                              idempotency_key
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Ingest Logs */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-[var(--foreground)]">
              Recent Ingest Events
            </h3>
            <button
              onClick={fetchLogs}
              className="px-3 py-1.5 text-xs font-medium rounded-md border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] hover:bg-[var(--accent)] transition-colors"
            >
              Refresh
            </button>
          </div>

          {logsLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-12 bg-[var(--secondary)] rounded animate-pulse"
                />
              ))}
            </div>
          ) : logs.length === 0 ? (
            <p className="text-sm text-[var(--muted-foreground)] py-4 text-center">
              No ingest events yet. Set up a Zap to get started.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-[var(--border)]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[var(--secondary)]">
                    <th className="px-4 py-2 text-left font-medium text-[var(--foreground)]">
                      Time
                    </th>
                    <th className="px-4 py-2 text-left font-medium text-[var(--foreground)]">
                      Source
                    </th>
                    <th className="px-4 py-2 text-left font-medium text-[var(--foreground)]">
                      Target
                    </th>
                    <th className="px-4 py-2 text-left font-medium text-[var(--foreground)]">
                      Status
                    </th>
                    <th className="px-4 py-2 text-left font-medium text-[var(--foreground)]">
                      Details
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-[var(--accent)]/50">
                      <td className="px-4 py-2 text-[var(--muted-foreground)] whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-2 text-[var(--foreground)]">
                        {log.source}
                      </td>
                      <td className="px-4 py-2 text-[var(--muted-foreground)]">
                        {log.routingTarget}
                      </td>
                      <td className="px-4 py-2">
                        <span
                          className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                            log.status === "success"
                              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                              : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                          }`}
                        >
                          {log.status}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-[var(--muted-foreground)] text-xs max-w-[200px] truncate">
                        {log.errorMessage ||
                          (log.thoughtId
                            ? `thought: ${log.thoughtId.slice(0, 8)}...`
                            : log.cardId
                              ? `card: ${log.cardId.slice(0, 8)}...`
                              : "\u2014")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
