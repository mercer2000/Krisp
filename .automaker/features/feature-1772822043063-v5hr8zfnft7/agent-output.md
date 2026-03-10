

Let me first look at the current state of the integrations page to understand what the end user sees.

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\(app)\\admin\\integrations\\IntegrationsClient.tsx"
}
Let me read the Gmail-related sections of the integrations client.

🔧 Tool: Grep
Input: {
  "pattern": "Gmail|gmail",
  "path": "C:\\Code\\Krisp\\app\\(app)\\admin\\integrations\\IntegrationsClient.tsx",
  "output_mode": "content",
  "-n": true
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\(app)\\admin\\integrations\\IntegrationsClient.tsx",
  "limit": 50
}
Let me read the GmailWatchManager component and the Gmail section of the page.

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\(app)\\admin\\integrations\\IntegrationsClient.tsx",
  "offset": 875,
  "limit": 250
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\(app)\\admin\\integrations\\IntegrationsClient.tsx",
  "offset": 2670,
  "limit": 250
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\(app)\\admin\\integrations\\IntegrationsClient.tsx",
  "offset": 2915,
  "limit": 100
}
Now I have a clear picture of the current Gmail section. The previous agent added the OAuth connect flow, but there's still a lot of developer-oriented content that end users shouldn't need to see:

1. **Webhook URL** section — internal/developer detail, not needed by end users
2. **Authentication** section — talks about `GMAIL_WEBHOOK_SECRET` env vars — developer detail
3. **"OAuth Connect (One-Click)"** section — redundant since the button is already there
4. **Apps Script alternative** — advanced/developer fallback
5. **Field Mapping Reference** — developer reference
6. **Response Codes** — developer reference

The end user experience should be: see the Connect Gmail button, click it, done. The developer docs can be collapsed/hidden.

Let me clean this up significantly.

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Simplify Gmail section for end users — hide developer details",
      "status": "in_progress",
      "activeForm": "Simplifying Gmail section for end users"
    },
    {
      "content": "Verify TypeScript compiles",
      "status": "pending",
      "activeForm": "Verifying TypeScript compiles"
    }
  ]
}

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "C:\\Code\\Krisp\\app\\(app)\\admin\\integrations\\IntegrationsClient.tsx",
  "old_string": "            <div className=\"p-6 space-y-8\">\n              {/* Webhook URL */}\n              <div>\n                <h3 className=\"text-sm font-semibold text-[var(--foreground)] mb-2\">\n                  Your Webhook URL\n                </h3>\n                <p className=\"text-sm text-[var(--muted-foreground)] mb-3\">\n                  This is your tenant-specific endpoint. Use it as the Pub/Sub push\n                  subscription URL or the Apps Script POST target.\n                </p>\n                <div className=\"flex items-center p-3 rounded-lg bg-[var(--secondary)] border border-[var(--border)]\">\n                  <code className=\"flex-1 text-sm text-[var(--foreground)] break-all\">\n                    {gmailWebhookUrl}\n                  </code>\n                  <CopyButton text={gmailWebhookUrl} />\n                </div>\n              </div>\n\n              {/* Authentication */}\n              <div>\n                <h3 className=\"text-sm font-semibold text-[var(--foreground)] mb-2\">\n                  Authentication\n                </h3>\n                <p className=\"text-sm text-[var(--muted-foreground)] mb-3\">\n                  Requests are authenticated via a <code className=\"px-1.5 py-0.5 rounded bg-[var(--secondary)] text-[var(--foreground)] text-xs\">?token=</code> query\n                  parameter, <code className=\"px-1.5 py-0.5 rounded bg-[var(--secondary)] text-[var(--foreground)] text-xs\">X-API-Key</code> header,\n                  or <code className=\"px-1.5 py-0.5 rounded bg-[var(--secondary)] text-[var(--foreground)] text-xs\">Authorization: Bearer</code> header\n                  matching the <code className=\"px-1.5 py-0.5 rounded bg-[var(--secondary)] text-[var(--foreground)] text-xs\">GMAIL_WEBHOOK_SECRET</code> environment\n                  variable.\n                </p>\n                <div className=\"p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-sm text-[var(--foreground)]\">\n                  Contact your server administrator for the secret value. It is\n                  defined as the <code className=\"font-mono\">GMAIL_WEBHOOK_SECRET</code> environment\n                  variable.\n                </div>\n              </div>\n\n              {/* Gmail Watch Manager */}\n              <GmailWatchManager />\n\n              {/* How it works */}\n              <div>\n                <div className=\"flex items-center gap-2 mb-4\">\n                  <span className=\"px-2.5 py-1 text-xs font-semibold rounded-full bg-green-500/10 text-green-600 border border-green-500/20\">\n                    Recommended\n                  </span>\n                  <h3 className=\"text-sm font-semibold text-[var(--foreground)]\">\n                    OAuth Connect (One-Click)\n                  </h3>\n                </div>\n                <p className=\"text-sm text-[var(--muted-foreground)] mb-3\">\n                  Click <span className=\"font-medium text-[var(--foreground)]\">Connect Gmail</span> above\n                  to sign in with your Google account. The OAuth flow grants read-only access to your\n                  inbox and automatically sets up real-time Pub/Sub notifications. Watch subscriptions\n                  expire every 7 days &mdash; use the <span className=\"font-medium text-[var(--foreground)]\">Renew Watch</span> button\n                  to extend them.\n                </p>\n              </div>\n\n              {/* Alternative: Apps Script */}\n              <div className=\"border-t border-[var(--border)] pt-8\">\n                <h3 className=\"text-sm font-semibold text-[var(--foreground)] mb-4\">\n                  Alternative &mdash; Apps Script (Polling)\n                </h3>\n                <p className=\"text-sm text-[var(--muted-foreground)] mb-4\">\n                  For a simpler setup that doesn&apos;t require Pub/Sub or OAuth on your backend,\n                  deploy this Google Apps Script template. It polls Gmail and POSTs directly to\n                  your webhook with a delay of up to 1 minute.\n                </p>\n\n                <ol className=\"space-y-6\">\n                  <li className=\"flex gap-4\">\n                    <span className=\"flex-shrink-0 w-7 h-7 rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] flex items-center justify-center text-sm font-semibold\">\n                      1\n                    </span>\n                    <div className=\"flex-1\">\n                      <p className=\"font-medium text-[var(--foreground)]\">\n                        Create an Apps Script Project\n                      </p>\n                      <p className=\"text-sm text-[var(--muted-foreground)] mt-1\">\n                        Open{\" \"}\n                        <span className=\"font-medium text-[var(--foreground)]\">script.google.com</span>{\" \"}\n                        while signed into the Gmail account you want to monitor. Create a new project.\n                      </p>\n                    </div>\n                  </li>\n\n                  <li className=\"flex gap-4\">\n                    <span className=\"flex-shrink-0 w-7 h-7 rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] flex items-center justify-center text-sm font-semibold\">\n                      2\n                    </span>\n                    <div className=\"flex-1\">\n                      <p className=\"font-medium text-[var(--foreground)]\">\n                        Paste the Script Template\n                      </p>\n                      <p className=\"text-sm text-[var(--muted-foreground)] mt-1\">\n                        Replace the default code with the following, using your webhook URL and\n                        API key:\n                      </p>\n                      <div className=\"mt-3\">\n                        <CodeBlock>{`function checkNewEmails() {\n  var webhookUrl = \"${gmailWebhookUrl}\";\n  var apiKey = \"YOUR_GMAIL_WEBHOOK_SECRET\";\n  var lastRun = PropertiesService.getScriptProperties()\n                  .getProperty(\"lastRun\") || \"2000/01/01\";\n\n  var threads = GmailApp.search(\"after:\" + lastRun + \" in:inbox\");\n\n  for (var i = 0; i < threads.length; i++) {\n    var messages = threads[i].getMessages();\n    for (var j = 0; j < messages.length; j++) {\n      var msg = messages[j];\n      var payload = {\n        messageId: msg.getId(),\n        sender: msg.getFrom(),\n        recipients: msg.getTo(),\n        subject: msg.getSubject(),\n        bodyPlain: msg.getPlainBody(),\n        bodyHtml: msg.getBody(),\n        receivedAt: msg.getDate().toISOString()\n      };\n\n      UrlFetchApp.fetch(webhookUrl, {\n        method: \"POST\",\n        headers: {\n          \"Content-Type\": \"application/json\",\n          \"X-API-Key\": apiKey\n        },\n        payload: JSON.stringify(payload),\n        muteHttpExceptions: true\n      });\n    }\n  }\n\n  PropertiesService.getScriptProperties()\n    .setProperty(\"lastRun\",\n      new Date().toLocaleDateString(\"en-US\"));\n}`}</CodeBlock>\n                      </div>\n                    </div>\n                  </li>\n\n                  <li className=\"flex gap-4\">\n                    <span className=\"flex-shrink-0 w-7 h-7 rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] flex items-center justify-center text-sm font-semibold\">\n                      3\n                    </span>\n                    <div className=\"flex-1\">\n                      <p className=\"font-medium text-[var(--foreground)]\">\n                        Run Once Manually\n                      </p>\n                      <p className=\"text-sm text-[var(--muted-foreground)] mt-1\">\n                        Click <span className=\"font-medium text-[var(--foreground)]\">Run</span> to\n                        execute the function once and grant the required Gmail permissions.\n                      </p>\n                    </div>\n                  </li>\n\n                  <li className=\"flex gap-4\">\n                    <span className=\"flex-shrink-0 w-7 h-7 rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] flex items-center justify-center text-sm font-semibold\">\n                      4\n                    </span>\n                    <div className=\"flex-1\">\n                      <p className=\"font-medium text-[var(--foreground)]\">\n                        Set Up a Time Trigger\n                      </p>\n                      <p className=\"text-sm text-[var(--muted-foreground)] mt-1\">\n                        Go to <span className=\"font-medium text-[var(--foreground)]\">Triggers</span>{\" \"}\n                        &rarr; <span className=\"font-medium text-[var(--foreground)]\">Add Trigger</span>{\" \"}\n                        &rarr; set <code className=\"px-1.5 py-0.5 rounded bg-[var(--secondary)] text-[var(--foreground)] text-xs\">checkNewEmails</code> to\n                        run every 1 minute.\n                      </p>\n                    </div>\n                  </li>\n                </ol>\n              </div>\n\n              {/* Field Mapping Reference */}\n              <div className=\"border-t border-[var(--border)] pt-8\">\n                <h3 className=\"text-sm font-semibold text-[var(--foreground)] mb-3\">\n                  Field Mapping Reference (Apps Script)\n                </h3>\n                <div className=\"overflow-x-auto rounded-lg border border-[var(--border)]\">\n                  <table className=\"w-full text-sm\">\n                    <thead>\n                      <tr className=\"bg-[var(--secondary)]\">\n                        <th className=\"px-4 py-3 text-left font-medium text-[var(--foreground)]\">\n                          Apps Script / Gmail Value\n                        </th>\n                        <th className=\"px-4 py-3 text-left font-medium text-[var(--foreground)]\">\n                          Webhook Payload Key\n                        </th>\n                        <th className=\"px-4 py-3 text-left font-medium text-[var(--foreground)]\">\n                          Description\n                        </th>\n                      </tr>\n                    </thead>\n                    <tbody className=\"divide-y divide-[var(--border)]\">\n                      {GMAIL_FIELD_MAPPING.map((field) => (\n                        <tr key={field.payload}>\n                          <td className=\"px-4 py-3\">\n                            <code className=\"px-1.5 py-0.5 rounded bg-[var(--secondary)] text-[var(--foreground)] text-xs\">\n                              {field.appsScript}\n                            </code>\n                          </td>\n                          <td className=\"px-4 py-3\">\n                            <code className=\"px-1.5 py-0.5 rounded bg-[var(--secondary)] text-[var(--foreground)] text-xs\">\n                              {field.payload}\n                            </code>\n                          </td>\n                          <td className=\"px-4 py-3 text-[var(--muted-foreground)]\">\n                            {field.description}\n                          </td>\n                        </tr>\n                      ))}\n                    </tbody>\n                  </table>\n                </div>\n              </div>\n\n              {/* Response Codes */}\n              <div>\n                <h3 className=\"text-sm font-semibold text-[var(--foreground)] mb-3\">\n                  Response Codes\n                </h3>\n                <div className=\"overflow-x-auto rounded-lg border border-[var(--border)]\">\n                  <table className=\"w-full text-sm\">\n                    <thead>\n                      <tr className=\"bg-[var(--secondary)]\">\n                        <th className=\"px-4 py-3 text-left font-medium text-[var(--foreground)]\">\n                          Code\n                        </th>\n                        <th className=\"px-4 py-3 text-left font-medium text-[var(--foreground)]\">\n                          Meaning\n                        </th>\n                      </tr>\n                    </thead>\n                    <tbody className=\"divide-y divide-[var(--border)]\">\n                      <tr>\n                        <td className=\"px-4 py-3\">\n                          <code className=\"px-1.5 py-0.5 rounded bg-green-500/10 text-green-600 text-xs font-semibold\">\n                            200\n                          </code>\n                        </td>\n                        <td className=\"px-4 py-3 text-[var(--muted-foreground)]\">\n                          Success or duplicate &mdash; Pub/Sub will not retry on 200\n                        </td>\n                      </tr>\n                      <tr>\n                        <td className=\"px-4 py-3\">\n                          <code className=\"px-1.5 py-0.5 rounded bg-green-500/10 text-green-600 text-xs font-semibold\">\n                            201\n                          </code>\n                        </td>\n                        <td className=\"px-4 py-3 text-[var(--muted-foreground)]\">\n                          Email received and stored successfully (Apps Script path)\n                        </td>\n                      </tr>\n                      <tr>\n                        <td className=\"px-4 py-3\">\n                          <code className=\"px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 text-xs font-semibold\">\n                            400\n                          </code>\n                        </td>\n                        <td className=\"px-4 py-3 text-[var(--muted-foreground)]\">\n                          Payload malformed or tenant resolution failed\n                        </td>\n                      </tr>\n                      <tr>\n                        <td className=\"px-4 py-3\">\n                          <code className=\"px-1.5 py-0.5 rounded bg-red-500/10 text-red-600 text-xs font-semibold\">\n                            401\n                          </code>\n                        </td>\n                        <td className=\"px-4 py-3 text-[var(--muted-foreground)]\">\n                          Auth token invalid\n                        </td>\n                      </tr>\n                      <tr>\n                        <td className=\"px-4 py-3\">\n                          <code className=\"px-1.5 py-0.5 rounded bg-red-500/10 text-red-600 text-xs font-semibold\">\n                            500\n                          </code>\n                        </td>\n                        <td className=\"px-4 py-3 text-[var(--muted-foreground)]\">\n                          Internal error &mdash; Pub/Sub will retry with exponential backoff\n                        </td>\n                      </tr>\n                    </tbody>\n                  </table>\n                </div>\n              </div>\n            </div>\n          </section>}",
  "new_string": "            <div className=\"p-6 space-y-6\">\n              {/* Gmail Watch Manager — the primary UX */}\n              <GmailWatchManager />\n\n              <p className=\"text-sm text-[var(--muted-foreground)]\">\n                Clicking <span className=\"font-medium text-[var(--foreground)]\">Connect Gmail</span> will\n                open Google&apos;s sign-in page where you grant read-only access to your inbox.\n                We&apos;ll automatically set up real-time notifications so new emails appear here\n                within seconds. The connection renews every 7 days &mdash; you&apos;ll see a reminder\n                when it&apos;s time.\n              </p>\n            </div>\n          </section>}"
}
Now let me also clean up the `GmailWatchManager` component — the header text mentions "Pub/Sub" which is a developer detail. Let me also check if `gmailWebhookUrl` and `GMAIL_FIELD_MAPPING` are still used elsewhere.

🔧 Tool: Grep
Input: {
  "pattern": "gmailWebhookUrl|GMAIL_FIELD_MAPPING",
  "path": "C:\\Code\\Krisp\\app\\(app)\\admin\\integrations\\IntegrationsClient.tsx",
  "output_mode": "content",
  "-n": true
}
Both `GMAIL_FIELD_MAPPING` and `gmailWebhookUrl` are now unused since we removed the Apps Script section, field mapping table, and webhook URL display. Let me check if they're referenced anywhere else.

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\(app)\\admin\\integrations\\IntegrationsClient.tsx",
  "offset": 50,
  "limit": 20
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\(app)\\admin\\integrations\\IntegrationsClient.tsx",
  "offset": 1838,
  "limit": 10
}
Both are now dead code. Let me remove them.

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "C:\\Code\\Krisp\\app\\(app)\\admin\\integrations\\IntegrationsClient.tsx",
  "old_string": "const GMAIL_FIELD_MAPPING = [\n  { appsScript: \"msg.getId()\", payload: \"messageId\", description: \"Unique Gmail message identifier (required for dedup)\" },\n  { appsScript: \"msg.getFrom()\", payload: \"sender\", description: \"Sender email address\" },\n  { appsScript: \"msg.getTo()\", payload: \"recipients\", description: \"Comma-separated recipient addresses\" },\n  { appsScript: \"msg.getSubject()\", payload: \"subject\", description: \"Email subject line\" },\n  { appsScript: \"msg.getPlainBody()\", payload: \"bodyPlain\", description: \"Plain text body\" },\n  { appsScript: \"msg.getBody()\", payload: \"bodyHtml\", description: \"HTML body content\" },\n  { appsScript: \"msg.getDate().toISOString()\", payload: \"receivedAt\", description: \"ISO 8601 timestamp\" },\n];\n\n",
  "new_string": "\n"
}

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "C:\\Code\\Krisp\\app\\(app)\\admin\\integrations\\IntegrationsClient.tsx",
  "old_string": "  const gmailWebhookUrl = `${origin}/api/webhooks/email/gmail/${tenantId}`;\n",
  "new_string": "\n"
}
Now let me update the `GmailWatchManager` header text to be more user-friendly (remove "Pub/Sub" mention).

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "C:\\Code\\Krisp\\app\\(app)\\admin\\integrations\\IntegrationsClient.tsx",
  "old_string": "      <h3 className=\"text-sm font-semibold text-[var(--foreground)] mb-2\">\n        Gmail Watch Status\n      </h3>\n      <p className=\"text-sm text-[var(--muted-foreground)] mb-3\">\n        The Gmail Watch monitors your inbox via Pub/Sub and automatically\n        fetches new emails. Watch subscriptions expire after 7 days and must\n        be renewed.\n      </p>",
  "new_string": "      <h3 className=\"text-sm font-semibold text-[var(--foreground)] mb-2\">\n        Connection Status\n      </h3>"
}
Now let me also check if `CodeBlock` is still used elsewhere, since we removed the Apps Script code block.

🔧 Tool: Grep
Input: {
  "pattern": "<CodeBlock|CodeBlock",
  "path": "C:\\Code\\Krisp\\app\\(app)\\admin\\integrations\\IntegrationsClient.tsx",
  "output_mode": "content",
  "-n": true
}
`CodeBlock` is still used in other tabs. Good. Now let me verify the build.

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Simplify Gmail section for end users — hide developer details",
      "status": "completed",
      "activeForm": "Simplifying Gmail section for end users"
    },
    {
      "content": "Verify TypeScript compiles",
      "status": "in_progress",
      "activeForm": "Verifying TypeScript compiles"
    }
  ]
}

🔧 Tool: Bash
Input: {
  "command": "cd \"C:\\Code\\Krisp\" && npx tsc --noEmit --pretty 2>&1 | head -80",
  "description": "TypeScript type check",
  "timeout": 120000
}
Clean compile. Let me verify the final state of the Gmail section by reading just that part.

🔧 Tool: Grep
Input: {
  "pattern": "Gmail Section|gmail.*section",
  "path": "C:\\Code\\Krisp\\app\\(app)\\admin\\integrations\\IntegrationsClient.tsx",
  "output_mode": "content",
  "-n": true
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\(app)\\admin\\integrations\\IntegrationsClient.tsx",
  "offset": 2663,
  "limit": 40
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Simplify Gmail section for end users — hide developer details",
      "status": "completed",
      "activeForm": "Simplifying Gmail section for end users"
    },
    {
      "content": "Verify TypeScript compiles",
      "status": "completed",
      "activeForm": "Verifying TypeScript compiles"
    }
  ]
}
Done. Here's what changed:

**The Gmail section on `/admin/integrations` now shows end users a clean, simple experience:**

1. **Header** — "Gmail / Google Workspace Email" with subtitle "Connect your Gmail account via OAuth to monitor your inbox"
2. **Connection Status** — shows a "Connect Gmail" button when disconnected, or the connected account details + Renew/Disconnect buttons when connected
3. **One paragraph** explaining what happens when you click Connect Gmail (Google sign-in, read-only access, automatic real-time notifications, 7-day renewal reminder)

**Removed developer-facing content:**
- Webhook URL display + copy button
- Authentication section (GMAIL_WEBHOOK_SECRET, token/header details)
- "OAuth Connect (One-Click)" section heading (redundant — the button is self-explanatory)
- Apps Script alternative with 4-step setup + code template
- Field Mapping Reference table
- Response Codes table
- Unused `GMAIL_FIELD_MAPPING` constant and `gmailWebhookUrl` variable
- "Pub/Sub" terminology from the watch status header

TypeScript compiles cleanly.