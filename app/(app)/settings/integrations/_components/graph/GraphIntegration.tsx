"use client";

import { useState, useEffect, useCallback } from "react";
import { IntegrationDetailLayout } from "../IntegrationDetailLayout";
import { getIntegration } from "../integrations";

interface GraphCredential {
  id: string;
  label: string;
  azureTenantId: string;
  clientId: string;
  clientSecretHint: string;
  createdAt: string;
  updatedAt: string;
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

// ── GraphCredentialsManager ──────────────────────────────────────
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
      setSuccess("Connection successful \u2014 obtained access token from Azure AD");
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

// ── GraphSubscriptionManager ─────────────────────────────────────
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

  useEffect(() => {
    if (credentials.length > 0 && !selectedCredentialId) {
      setSelectedCredentialId(credentials[0].id);
    }
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
      // Silently fail
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

// ── Main GraphIntegration component ──────────────────────────────
export function GraphIntegration({ tenantId }: { tenantId: string }) {
  const integration = getIntegration("graph")!;
  const [graphCredentials, setGraphCredentials] = useState<GraphCredential[]>([]);

  const origin = typeof window !== "undefined" ? window.location.origin : "https://your-domain.com";
  const graphWebhookUrl = `${origin}/api/webhooks/email/graph/${tenantId}`;

  const isConnected = graphCredentials.length > 0;

  const connectionSection = (
    <div className="space-y-8">
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

      {/* Connect & Subscribe */}
      <div>
        <h3 className="text-sm font-semibold text-[var(--foreground)] mb-4">
          Connect &amp; Subscribe
        </h3>

        <ol className="space-y-6">
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
    </div>
  );

  const settingsSection = (
    <div className="space-y-6">
      {/* Subscription Lifecycle */}
      <div>
        <h3 className="text-sm font-semibold text-[var(--foreground)] mb-3">
          Subscription Lifecycle
        </h3>
        <div className="overflow-x-auto rounded-lg border border-[var(--border)]">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[var(--secondary)]">
                <th className="px-4 py-3 text-left font-medium text-[var(--foreground)]">Phase</th>
                <th className="px-4 py-3 text-left font-medium text-[var(--foreground)]">What Happens</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              <tr>
                <td className="px-4 py-3 font-medium text-[var(--foreground)]">Create</td>
                <td className="px-4 py-3 text-[var(--muted-foreground)]">
                  POST to <code className="text-xs">/v1.0/subscriptions</code> &mdash; Microsoft sends
                  a GET with <code className="text-xs">validationToken</code> to your endpoint
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-medium text-[var(--foreground)]">Validate</td>
                <td className="px-4 py-3 text-[var(--muted-foreground)]">
                  Your endpoint echoes the token back as <code className="text-xs">text/plain</code> within
                  10 seconds (handled automatically)
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-medium text-[var(--foreground)]">Notify</td>
                <td className="px-4 py-3 text-[var(--muted-foreground)]">
                  On resource change, Microsoft POSTs a notification with <code className="text-xs">clientState</code>{" "}
                  for verification &mdash; your endpoint returns 202 within 3 seconds
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-medium text-[var(--foreground)]">Renew</td>
                <td className="px-4 py-3 text-[var(--muted-foreground)]">
                  PATCH the subscription before expiration (max 3 days for mail) with a new{" "}
                  <code className="text-xs">expirationDateTime</code>
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-medium text-[var(--foreground)]">Delete</td>
                <td className="px-4 py-3 text-[var(--muted-foreground)]">
                  DELETE <code className="text-xs">/v1.0/subscriptions/&#123;id&#125;</code> to stop
                  receiving notifications
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
  );

  return (
    <IntegrationDetailLayout
      integration={integration}
      connected={isConnected}
      connectionSection={connectionSection}
      settingsSection={settingsSection}
    />
  );
}
