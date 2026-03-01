

I understand the change: instead of generating a random secret, the user should be able to **enter** the webhook secret that Krisp shows them in their integration page. Let me read the current implementation to make the targeted changes.

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\(app)\\admin\\integrations\\IntegrationsClient.tsx",
  "offset": 1,
  "limit": 60
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\api\\webhook-secret\\route.ts"
}
Now let me read the `WebhookSecretManager` component in the integrations client.

🔧 Tool: Grep
Input: {
  "pattern": "function WebhookSecretManager",
  "path": "C:\\Code\\Krisp\\app\\(app)\\admin\\integrations\\IntegrationsClient.tsx",
  "output_mode": "content",
  "-n": true
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\(app)\\admin\\integrations\\IntegrationsClient.tsx",
  "offset": 107,
  "limit": 170
}
Now I have a clear picture. The change is straightforward: instead of **generating** a secret, let the user **enter** the secret from Krisp's integration page. I need to update:

1. **API route** (`/api/webhook-secret`) - POST should accept a user-provided secret instead of generating one
2. **UI component** (`WebhookSecretManager`) - Replace generate button with an input field + save button

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Update API route to accept user-provided secret",
      "status": "in_progress",
      "activeForm": "Updating API route to accept user-provided secret"
    },
    {
      "content": "Rewrite WebhookSecretManager UI to input-based flow",
      "status": "pending",
      "activeForm": "Rewriting WebhookSecretManager UI to input-based flow"
    },
    {
      "content": "Update setup guide text in Krisp tab",
      "status": "pending",
      "activeForm": "Updating setup guide text in Krisp tab"
    },
    {
      "content": "TypeScript check",
      "status": "pending",
      "activeForm": "Running TypeScript check"
    }
  ]
}
**Step 1: Update the API route** - POST should accept a `secret` from the request body instead of generating one. Remove the `randomBytes` import.

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "C:\\Code\\Krisp\\app\\api\\webhook-secret\\route.ts",
  "old_string": "import { NextResponse } from \"next/server\";\nimport { auth } from \"@/auth\";\nimport { db } from \"@/lib/db\";\nimport { webhookSecrets } from \"@/lib/db/schema\";\nimport { eq, and, sql } from \"drizzle-orm\";\nimport { randomBytes } from \"crypto\";",
  "new_string": "import { NextRequest, NextResponse } from \"next/server\";\nimport { auth } from \"@/auth\";\nimport { db } from \"@/lib/db\";\nimport { webhookSecrets } from \"@/lib/db/schema\";\nimport { eq, and, sql } from \"drizzle-orm\";"
}

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "C:\\Code\\Krisp\\app\\api\\webhook-secret\\route.ts",
  "old_string": "/**\n * POST /api/webhook-secret\n * Generates a new webhook secret for the user. Replaces any existing one.\n */\nexport async function POST() {\n  try {\n    const session = await auth();\n    const userId = session?.user?.id;\n    if (!userId) {\n      return NextResponse.json({ error: \"Unauthorized\" }, { status: 401 });\n    }\n\n    const secret = randomBytes(32).toString(\"hex\");\n\n    const [row] = await db\n      .insert(webhookSecrets)\n      .values({\n        userId,\n        name: \"Krisp\",\n        secret,\n      })\n      .onConflictDoUpdate({\n        target: [webhookSecrets.userId, webhookSecrets.name],\n        set: {\n          secret,\n          updatedAt: sql`NOW()`,\n        },\n      })\n      .returning();\n\n    return NextResponse.json({\n      secret: row.secret,\n      createdAt: row.createdAt,\n      updatedAt: row.updatedAt,\n    });\n  } catch (error) {\n    console.error(\"Error creating webhook secret:\", error);\n    return NextResponse.json(\n      { error: \"Failed to create webhook secret\" },\n      { status: 500 }\n    );\n  }\n}",
  "new_string": "/**\n * POST /api/webhook-secret\n * Saves the user-provided Krisp webhook secret. Replaces any existing one.\n */\nexport async function POST(request: NextRequest) {\n  try {\n    const session = await auth();\n    const userId = session?.user?.id;\n    if (!userId) {\n      return NextResponse.json({ error: \"Unauthorized\" }, { status: 401 });\n    }\n\n    const body = await request.json();\n    const secret = typeof body.secret === \"string\" ? body.secret.trim() : \"\";\n\n    if (!secret) {\n      return NextResponse.json(\n        { error: \"Secret is required\" },\n        { status: 400 }\n      );\n    }\n\n    const [row] = await db\n      .insert(webhookSecrets)\n      .values({\n        userId,\n        name: \"Krisp\",\n        secret,\n      })\n      .onConflictDoUpdate({\n        target: [webhookSecrets.userId, webhookSecrets.name],\n        set: {\n          secret,\n          updatedAt: sql`NOW()`,\n        },\n      })\n      .returning();\n\n    return NextResponse.json({\n      createdAt: row.createdAt,\n      updatedAt: row.updatedAt,\n    });\n  } catch (error) {\n    console.error(\"Error saving webhook secret:\", error);\n    return NextResponse.json(\n      { error: \"Failed to save webhook secret\" },\n      { status: 500 }\n    );\n  }\n}"
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Update API route to accept user-provided secret",
      "status": "completed",
      "activeForm": "Updating API route to accept user-provided secret"
    },
    {
      "content": "Rewrite WebhookSecretManager UI to input-based flow",
      "status": "in_progress",
      "activeForm": "Rewriting WebhookSecretManager UI to input-based flow"
    },
    {
      "content": "Update setup guide text in Krisp tab",
      "status": "pending",
      "activeForm": "Updating setup guide text in Krisp tab"
    },
    {
      "content": "TypeScript check",
      "status": "pending",
      "activeForm": "Running TypeScript check"
    }
  ]
}
**Step 2: Rewrite the `WebhookSecretManager` component** to an input-based flow where the user enters Krisp's secret.

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "C:\\Code\\Krisp\\app\\(app)\\admin\\integrations\\IntegrationsClient.tsx",
  "old_string": "function WebhookSecretManager() {\n  const [secret, setSecret] = useState<string | null>(null);\n  const [maskedSecret, setMaskedSecret] = useState<string | null>(null);\n  const [loading, setLoading] = useState(true);\n  const [generating, setGenerating] = useState(false);\n  const [showFull, setShowFull] = useState(false);\n  const [copied, setCopied] = useState(false);\n  const [error, setError] = useState<string | null>(null);\n\n  const fetchSecret = useCallback(async () => {\n    try {\n      setLoading(true);\n      setError(null);\n      const res = await fetch(\"/api/webhook-secret\");\n      if (!res.ok) throw new Error(\"Failed to fetch\");\n      const data = await res.json();\n      setMaskedSecret(data.secret);\n      setSecret(null);\n      setShowFull(false);\n    } catch {\n      setError(\"Failed to load webhook secret\");\n    } finally {\n      setLoading(false);\n    }\n  }, []);\n\n  useEffect(() => {\n    fetchSecret();\n  }, [fetchSecret]);\n\n  const handleGenerate = async () => {\n    setGenerating(true);\n    setError(null);\n    try {\n      const res = await fetch(\"/api/webhook-secret\", { method: \"POST\" });\n      if (!res.ok) throw new Error(\"Failed to generate\");\n      const data = await res.json();\n      setSecret(data.secret);\n      setMaskedSecret(null);\n      setShowFull(true);\n    } catch {\n      setError(\"Failed to generate webhook secret\");\n    } finally {\n      setGenerating(false);\n    }\n  };\n\n  const handleRevoke = async () => {\n    setError(null);\n    try {\n      const res = await fetch(\"/api/webhook-secret\", { method: \"DELETE\" });\n      if (!res.ok) throw new Error(\"Failed to revoke\");\n      setSecret(null);\n      setMaskedSecret(null);\n      setShowFull(false);\n    } catch {\n      setError(\"Failed to revoke webhook secret\");\n    }\n  };\n\n  const handleCopy = async () => {\n    if (!secret) return;\n    await navigator.clipboard.writeText(secret);\n    setCopied(true);\n    setTimeout(() => setCopied(false), 2000);\n  };\n\n  const displayValue = showFull && secret ? secret : maskedSecret;\n  const hasSecret = !!(secret || maskedSecret);\n\n  return (\n    <div>\n      <h3 className=\"text-sm font-semibold text-[var(--foreground)] mb-2\">\n        Authentication\n      </h3>\n      <p className=\"text-sm text-[var(--muted-foreground)] mb-3\">\n        Generate a webhook secret below, then paste it into the Krisp webhook\n        configuration as an{\" \"}\n        <code className=\"px-1.5 py-0.5 rounded bg-[var(--secondary)] text-[var(--foreground)] text-xs\">\n          Authorization\n        </code>{\" \"}\n        request header. Krisp will send this value with every webhook request\n        so the server can authenticate it.\n      </p>\n\n      {error && (\n        <div className=\"mb-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-600\">\n          {error}\n        </div>\n      )}\n\n      {loading ? (\n        <div className=\"p-4 rounded-lg bg-[var(--secondary)] border border-[var(--border)] text-sm text-[var(--muted-foreground)]\">\n          Loading...\n        </div>\n      ) : hasSecret ? (\n        <div className=\"space-y-3\">\n          {/* Secret display */}\n          <div>\n            <label className=\"text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider\">\n              Request Header\n            </label>\n            <div className=\"mt-1 flex items-center gap-2 p-3 rounded-lg bg-[var(--secondary)] border border-[var(--border)]\">\n              <span className=\"text-sm font-medium text-[var(--muted-foreground)] shrink-0\">\n                Authorization\n              </span>\n              <code className=\"flex-1 text-sm text-[var(--foreground)] font-mono break-all\">\n                {displayValue}\n              </code>\n              {secret && showFull && (\n                <button\n                  onClick={handleCopy}\n                  className=\"shrink-0 p-1.5 rounded-md border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] hover:bg-[var(--accent)] transition-colors\"\n                  title=\"Copy to clipboard\"\n                >\n                  {copied ? (\n                    <svg width=\"14\" height=\"14\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" strokeWidth=\"2\" strokeLinecap=\"round\" strokeLinejoin=\"round\">\n                      <polyline points=\"20 6 9 17 4 12\" />\n                    </svg>\n                  ) : (\n                    <svg width=\"14\" height=\"14\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" strokeWidth=\"2\" strokeLinecap=\"round\" strokeLinejoin=\"round\">\n                      <rect x=\"9\" y=\"9\" width=\"13\" height=\"13\" rx=\"2\" ry=\"2\" />\n                      <path d=\"M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1\" />\n                    </svg>\n                  )}\n                </button>\n              )}\n            </div>\n          </div>\n\n          {/* Action buttons */}\n          <div className=\"flex items-center gap-2\">\n            <button\n              onClick={handleGenerate}\n              disabled={generating}\n              className=\"px-3 py-1.5 text-xs font-medium rounded-md bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 transition-opacity disabled:opacity-50\"\n            >\n              {generating ? \"Regenerating...\" : \"Regenerate Secret\"}\n            </button>\n            <button\n              onClick={handleRevoke}\n              className=\"px-3 py-1.5 text-xs font-medium rounded-md border border-red-500/30 text-red-600 hover:bg-red-500/10 transition-colors\"\n            >\n              Revoke\n            </button>\n          </div>\n\n          {secret && showFull && (\n            <div className=\"p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-sm text-[var(--foreground)]\">\n              Copy this secret now. It will be masked after you leave this page.\n              Paste it into the Krisp webhook&apos;s Request Headers as the{\" \"}\n              <code className=\"font-mono\">Authorization</code> value.\n            </div>\n          )}\n        </div>\n      ) : (\n        <div className=\"space-y-3\">\n          <div className=\"p-4 rounded-lg bg-[var(--secondary)] border border-[var(--border)] text-sm text-[var(--muted-foreground)]\">\n            No webhook secret configured. Generate one to enable authenticated\n            webhook delivery from Krisp.\n          </div>\n          <button\n            onClick={handleGenerate}\n            disabled={generating}\n            className=\"px-4 py-2 text-sm font-medium rounded-md bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 transition-opacity disabled:opacity-50\"\n          >\n            {generating ? \"Generating...\" : \"Generate Webhook Secret\"}\n          </button>\n        </div>\n      )}\n    </div>\n  );\n}",
  "new_string": "function WebhookSecretManager() {\n  const [maskedSecret, setMaskedSecret] = useState<string | null>(null);\n  const [inputValue, setInputValue] = useState(\"\");\n  const [loading, setLoading] = useState(true);\n  const [saving, setSaving] = useState(false);\n  const [error, setError] = useState<string | null>(null);\n  const [success, setSuccess] = useState<string | null>(null);\n\n  const fetchSecret = useCallback(async () => {\n    try {\n      setLoading(true);\n      setError(null);\n      const res = await fetch(\"/api/webhook-secret\");\n      if (!res.ok) throw new Error(\"Failed to fetch\");\n      const data = await res.json();\n      setMaskedSecret(data.secret);\n    } catch {\n      setError(\"Failed to load webhook secret\");\n    } finally {\n      setLoading(false);\n    }\n  }, []);\n\n  useEffect(() => {\n    fetchSecret();\n  }, [fetchSecret]);\n\n  const handleSave = async () => {\n    if (!inputValue.trim()) return;\n    setSaving(true);\n    setError(null);\n    setSuccess(null);\n    try {\n      const res = await fetch(\"/api/webhook-secret\", {\n        method: \"POST\",\n        headers: { \"Content-Type\": \"application/json\" },\n        body: JSON.stringify({ secret: inputValue.trim() }),\n      });\n      if (!res.ok) throw new Error(\"Failed to save\");\n      setInputValue(\"\");\n      setSuccess(\"Webhook secret saved\");\n      setTimeout(() => setSuccess(null), 3000);\n      await fetchSecret();\n    } catch {\n      setError(\"Failed to save webhook secret\");\n    } finally {\n      setSaving(false);\n    }\n  };\n\n  const handleRemove = async () => {\n    setError(null);\n    setSuccess(null);\n    try {\n      const res = await fetch(\"/api/webhook-secret\", { method: \"DELETE\" });\n      if (!res.ok) throw new Error(\"Failed to remove\");\n      setMaskedSecret(null);\n      setSuccess(\"Webhook secret removed\");\n      setTimeout(() => setSuccess(null), 3000);\n    } catch {\n      setError(\"Failed to remove webhook secret\");\n    }\n  };\n\n  return (\n    <div>\n      <h3 className=\"text-sm font-semibold text-[var(--foreground)] mb-2\">\n        Authentication\n      </h3>\n      <p className=\"text-sm text-[var(--muted-foreground)] mb-3\">\n        Enter the{\" \"}\n        <code className=\"px-1.5 py-0.5 rounded bg-[var(--secondary)] text-[var(--foreground)] text-xs\">\n          Authorization\n        </code>{\" \"}\n        secret from your Krisp webhook configuration. Krisp sends this value\n        in the request header with every webhook call so the server can\n        authenticate it.\n      </p>\n\n      {error && (\n        <div className=\"mb-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-600\">\n          {error}\n        </div>\n      )}\n      {success && (\n        <div className=\"mb-3 p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-sm text-green-600\">\n          {success}\n        </div>\n      )}\n\n      {loading ? (\n        <div className=\"p-4 rounded-lg bg-[var(--secondary)] border border-[var(--border)] text-sm text-[var(--muted-foreground)]\">\n          Loading...\n        </div>\n      ) : (\n        <div className=\"space-y-3\">\n          {/* Current secret display */}\n          {maskedSecret && (\n            <div>\n              <label className=\"text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider\">\n                Current Secret\n              </label>\n              <div className=\"mt-1 flex items-center gap-2 p-3 rounded-lg bg-[var(--secondary)] border border-[var(--border)]\">\n                <code className=\"flex-1 text-sm text-[var(--foreground)] font-mono\">\n                  {maskedSecret}\n                </code>\n                <button\n                  onClick={handleRemove}\n                  className=\"shrink-0 px-3 py-1.5 text-xs font-medium rounded-md border border-red-500/30 text-red-600 hover:bg-red-500/10 transition-colors\"\n                >\n                  Remove\n                </button>\n              </div>\n            </div>\n          )}\n\n          {/* Secret input */}\n          <div>\n            <label className=\"text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider\">\n              {maskedSecret ? \"Update Secret\" : \"Webhook Secret\"}\n            </label>\n            <div className=\"mt-1 flex items-center gap-2\">\n              <input\n                type=\"password\"\n                value={inputValue}\n                onChange={(e) => setInputValue(e.target.value)}\n                placeholder=\"Paste your Krisp Authorization secret here\"\n                className=\"flex-1 px-3 py-2 text-sm rounded-md border border-[var(--border)] bg-[var(--secondary)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]\"\n                onKeyDown={(e) => {\n                  if (e.key === \"Enter\") handleSave();\n                }}\n              />\n              <button\n                onClick={handleSave}\n                disabled={saving || !inputValue.trim()}\n                className=\"shrink-0 px-4 py-2 text-sm font-medium rounded-md bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 transition-opacity disabled:opacity-50\"\n              >\n                {saving ? \"Saving...\" : \"Save\"}\n              </button>\n            </div>\n          </div>\n        </div>\n      )}\n    </div>\n  );\n}"
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Update API route to accept user-provided secret",
      "status": "completed",
      "activeForm": "Updating API route to accept user-provided secret"
    },
    {
      "content": "Rewrite WebhookSecretManager UI to input-based flow",
      "status": "completed",
      "activeForm": "Rewriting WebhookSecretManager UI to input-based flow"
    },
    {
      "content": "Update setup guide text in Krisp tab",
      "status": "in_progress",
      "activeForm": "Updating setup guide text in Krisp tab"
    },
    {
      "content": "TypeScript check",
      "status": "pending",
      "activeForm": "Running TypeScript check"
    }
  ]
}
**Step 3: Update setup guide text.** Let me check the Step 3 text in the Krisp setup guide.

🔧 Tool: Grep
Input: {
  "pattern": "Configure Authentication|Authorization.*header.*secret.*generated",
  "path": "C:\\Code\\Krisp\\app\\(app)\\admin\\integrations\\IntegrationsClient.tsx",
  "output_mode": "content",
  "-n": true,
  "-C": 5
}

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "C:\\Code\\Krisp\\app\\(app)\\admin\\integrations\\IntegrationsClient.tsx",
  "old_string": "                      <p className=\"text-sm text-[var(--muted-foreground)] mt-1\">\n                        In the webhook&apos;s Request Headers section, add an{\" \"}\n                        <code className=\"px-1.5 py-0.5 rounded bg-[var(--secondary)] text-[var(--foreground)] text-xs\">Authorization</code>{\" \"}\n                        header with the secret generated in the Authentication section above.\n                      </p>",
  "new_string": "                      <p className=\"text-sm text-[var(--muted-foreground)] mt-1\">\n                        In Krisp&apos;s webhook Request Headers section, add an{\" \"}\n                        <code className=\"px-1.5 py-0.5 rounded bg-[var(--secondary)] text-[var(--foreground)] text-xs\">Authorization</code>{\" \"}\n                        header. Then copy that same secret value and paste it into the Authentication section above.\n                      </p>"
}
Now the `useCallback` import is no longer strictly needed since we still use it, and `showFull`/`copied` states were removed. Let me also clean up unused imports. The component still uses `useCallback` and `useEffect`, so those are fine. But `showFull` and `copied` were local state, not imports. Good.

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Update API route to accept user-provided secret",
      "status": "completed",
      "activeForm": "Updating API route to accept user-provided secret"
    },
    {
      "content": "Rewrite WebhookSecretManager UI to input-based flow",
      "status": "completed",
      "activeForm": "Rewriting WebhookSecretManager UI to input-based flow"
    },
    {
      "content": "Update setup guide text in Krisp tab",
      "status": "completed",
      "activeForm": "Updating setup guide text in Krisp tab"
    },
    {
      "content": "TypeScript check",
      "status": "in_progress",
      "activeForm": "Running TypeScript check"
    }
  ]
}

🔧 Tool: Bash
Input: {
  "command": "cd C:/Code/Krisp && npx tsc --noEmit 2>&1 | head -30",
  "description": "TypeScript type check",
  "timeout": 60000
}
Clean compile, no errors.

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Update API route to accept user-provided secret",
      "status": "completed",
      "activeForm": "Updating API route to accept user-provided secret"
    },
    {
      "content": "Rewrite WebhookSecretManager UI to input-based flow",
      "status": "completed",
      "activeForm": "Rewriting WebhookSecretManager UI to input-based flow"
    },
    {
      "content": "Update setup guide text in Krisp tab",
      "status": "completed",
      "activeForm": "Updating setup guide text in Krisp tab"
    },
    {
      "content": "TypeScript check",
      "status": "completed",
      "activeForm": "Running TypeScript check"
    }
  ]
}
Done. Here's what changed:

**API route** (`app/api/webhook-secret/route.ts`):
- POST now accepts `{ secret: string }` in the request body instead of auto-generating one
- Validates the secret is a non-empty string, returns 400 if missing
- Removed `randomBytes` / `crypto` import
- Response no longer returns the secret back (no need since the user provided it)

**UI** (`IntegrationsClient.tsx` - `WebhookSecretManager`):
- Replaced the "Generate" flow with a **password input field** + **Save button** where the user pastes Krisp's Authorization secret
- Shows the current saved secret (masked) with a **Remove** button
- Input supports Enter key to save
- Success/error feedback messages

**Setup guide** (Step 3):
- Updated text to tell users to copy the secret from Krisp's webhook config and paste it into the Authentication section