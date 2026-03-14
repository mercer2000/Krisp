"use client";

import { IntegrationDetailLayout } from "../IntegrationDetailLayout";
import { getIntegration } from "../integrations";
import { CopyButton, CodeBlock, FIELD_MAPPING } from "../shared";

export function Microsoft365Integration({ tenantId }: { tenantId: string }) {
  const integration = getIntegration("microsoft365")!;

  const origin = typeof window !== "undefined" ? window.location.origin : "https://your-domain.com";
  const webhookUrl = `${origin}/api/webhooks/email/microsoft365/${tenantId}`;

  const connectionSection = (
    <div className="space-y-8">
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
                <th className="px-4 py-3 text-left font-medium text-[var(--foreground)]">Code</th>
                <th className="px-4 py-3 text-left font-medium text-[var(--foreground)]">Meaning</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              <tr>
                <td className="px-4 py-3">
                  <code className="px-1.5 py-0.5 rounded bg-green-500/10 text-green-600 text-xs font-semibold">200</code>
                </td>
                <td className="px-4 py-3 text-[var(--muted-foreground)]">Duplicate email &mdash; already processed (safe to ignore)</td>
              </tr>
              <tr>
                <td className="px-4 py-3">
                  <code className="px-1.5 py-0.5 rounded bg-green-500/10 text-green-600 text-xs font-semibold">201</code>
                </td>
                <td className="px-4 py-3 text-[var(--muted-foreground)]">Email received and stored successfully</td>
              </tr>
              <tr>
                <td className="px-4 py-3">
                  <code className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 text-xs font-semibold">400</code>
                </td>
                <td className="px-4 py-3 text-[var(--muted-foreground)]">Validation error &mdash; check payload structure</td>
              </tr>
              <tr>
                <td className="px-4 py-3">
                  <code className="px-1.5 py-0.5 rounded bg-red-500/10 text-red-600 text-xs font-semibold">401</code>
                </td>
                <td className="px-4 py-3 text-[var(--muted-foreground)]">Unauthorized &mdash; invalid or missing API key</td>
              </tr>
              <tr>
                <td className="px-4 py-3">
                  <code className="px-1.5 py-0.5 rounded bg-red-500/10 text-red-600 text-xs font-semibold">404</code>
                </td>
                <td className="px-4 py-3 text-[var(--muted-foreground)]">Tenant not found</td>
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
