"use client";

import { IntegrationDetailLayout } from "../IntegrationDetailLayout";
import { getIntegration } from "../integrations";
import { CopyButton, CodeBlock, CRISP_EVENTS, DefaultBoardSelector, WebhookSecretManager } from "../shared";

export function KrispIntegration({ tenantId }: { tenantId: string }) {
  const integration = getIntegration("krisp")!;

  const origin = typeof window !== "undefined" ? window.location.origin : "https://your-domain.com";
  const crispWebhookUrl = `${origin}/api/webhooks/key-points?user_id=${tenantId}`;

  const connectionSection = (
    <div className="space-y-8">
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
                <th className="px-4 py-3 text-left font-medium text-[var(--foreground)]">Event Type</th>
                <th className="px-4 py-3 text-left font-medium text-[var(--foreground)]">Description</th>
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
                <th className="px-4 py-3 text-left font-medium text-[var(--foreground)]">Code</th>
                <th className="px-4 py-3 text-left font-medium text-[var(--foreground)]">Meaning</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              <tr>
                <td className="px-4 py-3">
                  <code className="px-1.5 py-0.5 rounded bg-green-500/10 text-green-600 text-xs font-semibold">200</code>
                </td>
                <td className="px-4 py-3 text-[var(--muted-foreground)]">Duplicate webhook &mdash; already processed (idempotent, safe to ignore)</td>
              </tr>
              <tr>
                <td className="px-4 py-3">
                  <code className="px-1.5 py-0.5 rounded bg-green-500/10 text-green-600 text-xs font-semibold">201</code>
                </td>
                <td className="px-4 py-3 text-[var(--muted-foreground)]">Webhook received and stored successfully</td>
              </tr>
              <tr>
                <td className="px-4 py-3">
                  <code className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 text-xs font-semibold">400</code>
                </td>
                <td className="px-4 py-3 text-[var(--muted-foreground)]">Validation error &mdash; missing fields, unsupported event type, or invalid payload</td>
              </tr>
              <tr>
                <td className="px-4 py-3">
                  <code className="px-1.5 py-0.5 rounded bg-red-500/10 text-red-600 text-xs font-semibold">401</code>
                </td>
                <td className="px-4 py-3 text-[var(--muted-foreground)]">Unauthorized &mdash; invalid or missing Authorization header</td>
              </tr>
              <tr>
                <td className="px-4 py-3">
                  <code className="px-1.5 py-0.5 rounded bg-red-500/10 text-red-600 text-xs font-semibold">404</code>
                </td>
                <td className="px-4 py-3 text-[var(--muted-foreground)]">User not found &mdash; the user_id in the URL does not match any account</td>
              </tr>
              <tr>
                <td className="px-4 py-3">
                  <code className="px-1.5 py-0.5 rounded bg-red-500/10 text-red-600 text-xs font-semibold">500</code>
                </td>
                <td className="px-4 py-3 text-[var(--muted-foreground)]">Internal server error &mdash; retry after a delay</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  return (
    <IntegrationDetailLayout
      integration={integration}
      connected={false}
      connectionSection={connectionSection}
    />
  );
}
