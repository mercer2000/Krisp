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

export function IntegrationsClient({ tenantId }: { tenantId: string }) {
  const [activeTab, setActiveTab] = useState<TabId>("microsoft365");
  const origin = typeof window !== "undefined" ? window.location.origin : "https://your-domain.com";
  const webhookUrl = `${origin}/api/webhooks/email/microsoft365/${tenantId}`;
  const gmailWebhookUrl = `${origin}/api/webhooks/email/gmail/${tenantId}`;
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
                  across all your meeting content.
                </p>
              </div>

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
