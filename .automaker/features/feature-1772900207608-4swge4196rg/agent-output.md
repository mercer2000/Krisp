

I'll start by exploring the existing inbox implementation to understand the current structure and identify opportunities for localStorage-based caching.

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Explore existing inbox codebase structure",
      "status": "in_progress",
      "activeForm": "Exploring existing inbox codebase structure"
    },
    {
      "content": "Design secure localStorage caching strategy",
      "status": "pending",
      "activeForm": "Designing secure localStorage caching strategy"
    },
    {
      "content": "Implement localStorage cache utility",
      "status": "pending",
      "activeForm": "Implementing localStorage cache utility"
    },
    {
      "content": "Integrate caching into inbox data flow",
      "status": "pending",
      "activeForm": "Integrating caching into inbox data flow"
    },
    {
      "content": "Add cache invalidation and freshness logic",
      "status": "pending",
      "activeForm": "Adding cache invalidation and freshness logic"
    }
  ]
}

🔧 Tool: Task
Input: {
  "description": "Explore inbox codebase structure",
  "prompt": "Explore the inbox feature in this Next.js codebase. I need to understand:\n\n1. The inbox page component(s) - look in `app/(app)/inbox/`\n2. The inbox API routes - look in `app/api/emails/` and related\n3. Any hooks used for fetching inbox data (check `lib/hooks/`)\n4. The email types (check `types/email.ts`)\n5. How emails are currently fetched and displayed\n6. The data flow from API to UI\n\nRead all relevant files fully. Provide complete file contents and a clear summary of the architecture.",
  "subagent_type": "Explore"
}

🔧 Tool: Task
Input: {
  "description": "Explore email API routes",
  "prompt": "Explore all email-related API routes in this codebase. Read the following files fully:\n\n1. `app/api/emails/route.ts` - main emails endpoint\n2. `app/api/emails/[id]/route.ts` - individual email endpoint\n3. `app/api/emails/classify/route.ts` - email classification\n4. Any other files in `app/api/emails/` directory\n5. `lib/email/emails.ts` - email utility functions\n6. `lib/email/labels.ts` - email label functions\n\nI need to understand:\n- What data structures are returned from the API\n- How emails are queried from the database\n- What parameters the API accepts (pagination, filters, etc.)\n- The response format\n\nProvide complete file contents and analysis.",
  "subagent_type": "Explore"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\(app)\\inbox\\page.tsx"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\types\\email.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\lib\\db\\schema.ts"
}

🔧 Tool: Glob
Input: {
  "pattern": "app/api/emails/**/*.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\api\\emails\\route.ts"
}

🔧 Tool: Glob
Input: {
  "pattern": "lib/hooks/useEmail*.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\api\\emails\\[id]\\route.ts"
}

🔧 Tool: Glob
Input: {
  "pattern": "lib/hooks/useInbox*.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\api\\emails\\classify\\route.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\lib\\email\\emails.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\lib\\email\\labels.ts"
}

🔧 Tool: Glob
Input: {
  "pattern": "app/api/emails/**/*.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\api\\emails\\route.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\api\\emails\\search\\route.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\api\\emails\\accounts\\route.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\api\\emails\\labels\\route.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\types\\email.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\api\\emails\\[id]\\route.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\lib\\validators\\schemas.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\lib\\email\\db.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\api\\emails\\labels\\route.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\api\\emails\\accounts\\route.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\lib\\email\\emails.ts",
  "limit": 100
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\lib\\email\\labels.ts",
  "limit": 100
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\lib\\gmail\\emails.ts",
  "limit": 100
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\api\\emails\\search\\route.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\lib\\gmail\\emails.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\lib\\zoom\\messages.ts"
}
Now let me read the actual inbox page component to understand the exact data flow and identify where caching should be inserted.

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\(app)\\inbox\\page.tsx",
  "limit": 100
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\types\\email.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\(app)\\inbox\\page.tsx",
  "offset": 100,
  "limit": 200
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\(app)\\inbox\\page.tsx",
  "offset": 299,
  "limit": 200
}
Now I have a thorough understanding of the inbox architecture. Let me update my todos and start implementing.

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Explore existing inbox codebase structure",
      "status": "completed",
      "activeForm": "Exploring existing inbox codebase structure"
    },
    {
      "content": "Create secure localStorage cache utility (lib/cache/inboxCache.ts)",
      "status": "in_progress",
      "activeForm": "Creating secure localStorage cache utility"
    },
    {
      "content": "Create useInboxCache hook for React integration",
      "status": "pending",
      "activeForm": "Creating useInboxCache hook"
    },
    {
      "content": "Integrate caching into inbox page component",
      "status": "pending",
      "activeForm": "Integrating caching into inbox page component"
    },
    {
      "content": "Add cache invalidation on mutations (delete, sync, classify)",
      "status": "pending",
      "activeForm": "Adding cache invalidation on mutations"
    }
  ]
}
Let me check the existing lib directory structure and hooks pattern.

🔧 Tool: Glob
Input: {
  "pattern": "lib/hooks/*.ts"
}

🔧 Tool: Glob
Input: {
  "pattern": "lib/cache/**/*"
}
Let me look at an existing hook to understand the pattern used.

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\lib\\hooks\\useSearch.ts"
}
Good, the project uses `@tanstack/react-query`. However, the inbox page uses raw `fetch` calls with manual state management. My approach will be:

1. **Create a lightweight localStorage cache utility** that handles TTL, versioning, and size limits — no encryption needed since the data is already served over authenticated API (sensitive fields like body/HTML aren't included in list items)
2. **Create a `useInboxCache` hook** that wraps the existing fetch logic with a stale-while-revalidate pattern
3. **Integrate into the inbox page** with minimal changes to the existing component

Let me create the cache utility first.

🔧 Tool: Bash
Input: {
  "command": "ls C:/Code/Krisp/lib/",
  "description": "List lib directory contents"
}

🔧 Tool: Write
Input: {
  "file_path": "C:\\Code\\Krisp\\lib\\cache\\inboxCache.ts",
  "content": "/**\n * Secure localStorage cache for inbox data.\n *\n * Design decisions:\n * - TTL-based expiry (default 5 minutes) so stale data is never shown for long\n * - Version key allows cache busting on schema changes\n * - Size-bounded: evicts oldest entries when total exceeds limit\n * - Only caches list-level data (EmailListItem[]) — no body/HTML content\n * - Keyed by filter params so each view has its own cache entry\n */\n\nconst CACHE_PREFIX = \"krisp_inbox_\";\nconst CACHE_VERSION = 1;\nconst DEFAULT_TTL_MS = 5 * 60 * 1000; // 5 minutes\nconst MAX_CACHE_ENTRIES = 20;\n\ninterface CacheEntry<T> {\n  version: number;\n  timestamp: number;\n  data: T;\n}\n\nfunction cacheKey(suffix: string): string {\n  return `${CACHE_PREFIX}v${CACHE_VERSION}_${suffix}`;\n}\n\n/** Build a deterministic key from inbox query params. */\nexport function buildInboxCacheKey(params: {\n  page?: number;\n  limit?: number;\n  query?: string;\n  after?: string;\n  before?: string;\n  accountId?: string | null;\n  provider?: string | null;\n  folder?: string;\n}): string {\n  const parts = [\n    `p${params.page ?? 1}`,\n    `l${params.limit ?? 50}`,\n    params.query ? `q${params.query}` : \"\",\n    params.after ? `a${params.after}` : \"\",\n    params.before ? `b${params.before}` : \"\",\n    params.accountId ? `acc${params.accountId}` : \"\",\n    params.provider ? `prov${params.provider}` : \"\",\n    params.folder && params.folder !== \"all\" ? `f${params.folder}` : \"\",\n  ]\n    .filter(Boolean)\n    .join(\"_\");\n  return cacheKey(`list_${parts}`);\n}\n\nexport function buildCacheKey(namespace: string): string {\n  return cacheKey(namespace);\n}\n\n/** Read a cache entry. Returns null if missing, expired, or wrong version. */\nexport function readCache<T>(key: string, ttlMs = DEFAULT_TTL_MS): T | null {\n  try {\n    const raw = localStorage.getItem(key);\n    if (!raw) return null;\n\n    const entry: CacheEntry<T> = JSON.parse(raw);\n    if (entry.version !== CACHE_VERSION) {\n      localStorage.removeItem(key);\n      return null;\n    }\n    if (Date.now() - entry.timestamp > ttlMs) {\n      localStorage.removeItem(key);\n      return null;\n    }\n    return entry.data;\n  } catch {\n    // Corrupted entry — remove it\n    try { localStorage.removeItem(key); } catch {}\n    return null;\n  }\n}\n\n/** Write a cache entry. Evicts oldest entries if over the limit. */\nexport function writeCache<T>(key: string, data: T): void {\n  try {\n    const entry: CacheEntry<T> = {\n      version: CACHE_VERSION,\n      timestamp: Date.now(),\n      data,\n    };\n    evictIfNeeded();\n    localStorage.setItem(key, JSON.stringify(entry));\n  } catch {\n    // localStorage full or unavailable — silently skip\n  }\n}\n\n/** Remove a specific cache entry. */\nexport function removeCache(key: string): void {\n  try {\n    localStorage.removeItem(key);\n  } catch {}\n}\n\n/** Remove all inbox cache entries (e.g. after a sync or mutation). */\nexport function clearInboxCache(): void {\n  try {\n    const keysToRemove: string[] = [];\n    for (let i = 0; i < localStorage.length; i++) {\n      const k = localStorage.key(i);\n      if (k && k.startsWith(CACHE_PREFIX)) {\n        keysToRemove.push(k);\n      }\n    }\n    for (const k of keysToRemove) {\n      localStorage.removeItem(k);\n    }\n  } catch {}\n}\n\n/** Evict oldest inbox entries when we have too many. */\nfunction evictIfNeeded(): void {\n  try {\n    const entries: { key: string; timestamp: number }[] = [];\n    for (let i = 0; i < localStorage.length; i++) {\n      const k = localStorage.key(i);\n      if (k && k.startsWith(CACHE_PREFIX)) {\n        try {\n          const raw = localStorage.getItem(k);\n          if (raw) {\n            const parsed = JSON.parse(raw);\n            entries.push({ key: k, timestamp: parsed.timestamp ?? 0 });\n          }\n        } catch {\n          // Corrupted — remove\n          localStorage.removeItem(k);\n        }\n      }\n    }\n    // Evict oldest entries beyond the limit\n    if (entries.length >= MAX_CACHE_ENTRIES) {\n      entries.sort((a, b) => a.timestamp - b.timestamp);\n      const toRemove = entries.slice(0, entries.length - MAX_CACHE_ENTRIES + 1);\n      for (const e of toRemove) {\n        localStorage.removeItem(e.key);\n      }\n    }\n  } catch {}\n}\n"
}
Now let me create the `useInboxCache` hook that implements a stale-while-revalidate pattern.

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Explore existing inbox codebase structure",
      "status": "completed",
      "activeForm": "Exploring existing inbox codebase structure"
    },
    {
      "content": "Create secure localStorage cache utility (lib/cache/inboxCache.ts)",
      "status": "completed",
      "activeForm": "Creating secure localStorage cache utility"
    },
    {
      "content": "Create useInboxCache hook for React integration",
      "status": "in_progress",
      "activeForm": "Creating useInboxCache hook"
    },
    {
      "content": "Integrate caching into inbox page component",
      "status": "pending",
      "activeForm": "Integrating caching into inbox page component"
    },
    {
      "content": "Add cache invalidation on mutations (delete, sync, classify)",
      "status": "pending",
      "activeForm": "Adding cache invalidation on mutations"
    }
  ]
}

🔧 Tool: Write
Input: {
  "file_path": "C:\\Code\\Krisp\\lib\\hooks\\useInboxCache.ts",
  "content": "\"use client\";\n\nimport { useCallback, useRef } from \"react\";\nimport {\n  buildInboxCacheKey,\n  buildCacheKey,\n  readCache,\n  writeCache,\n  clearInboxCache,\n} from \"@/lib/cache/inboxCache\";\nimport type { EmailListResponse, EmailSearchResponse } from \"@/types/email\";\n\ninterface InboxFetchParams {\n  page: number;\n  limit: number;\n  query: string;\n  afterDate: string;\n  beforeDate: string;\n  filterAccount: string | null;\n  filterProvider: \"outlook\" | \"gmail\" | \"zoom\" | null;\n  activeFolder: \"inbox\" | \"newsletter\" | \"spam\" | \"all\";\n}\n\ninterface CachedListData {\n  response: EmailListResponse;\n}\n\ninterface CachedSearchData {\n  response: EmailSearchResponse;\n}\n\n/**\n * Hook that provides stale-while-revalidate caching for inbox data.\n *\n * On mount / filter change:\n * 1. Check localStorage for cached data matching the current filters\n * 2. If found, render immediately (no loading spinner)\n * 3. Fetch fresh data in the background\n * 4. Update UI + cache when fresh data arrives\n *\n * This eliminates the loading flash when revisiting the inbox or\n * switching between pages/folders the user has already seen.\n */\nexport function useInboxCache() {\n  const lastCacheKeyRef = useRef<string>(\"\");\n\n  /** Try to read cached list data for the given params. */\n  const getCachedEmails = useCallback(\n    (params: InboxFetchParams): CachedListData | null => {\n      const key = buildInboxCacheKey({\n        page: params.page,\n        limit: params.limit,\n        query: params.query || undefined,\n        after: params.afterDate || undefined,\n        before: params.beforeDate || undefined,\n        accountId: params.filterAccount,\n        provider: params.filterProvider,\n        folder: params.activeFolder,\n      });\n      lastCacheKeyRef.current = key;\n\n      if (params.query && !params.afterDate && !params.beforeDate) {\n        // Semantic search — use search cache\n        const cached = readCache<CachedSearchData>(key);\n        if (cached) {\n          return {\n            response: {\n              data: cached.response.data,\n              total: cached.response.data.length,\n              page: 1,\n              limit: params.limit,\n            },\n          };\n        }\n        return null;\n      }\n\n      return readCache<CachedListData>(key);\n    },\n    []\n  );\n\n  /** Try to read cached search data for the given params. */\n  const getCachedSearch = useCallback(\n    (params: InboxFetchParams): CachedSearchData | null => {\n      const key = buildInboxCacheKey({\n        page: params.page,\n        limit: params.limit,\n        query: params.query || undefined,\n        after: params.afterDate || undefined,\n        before: params.beforeDate || undefined,\n        accountId: params.filterAccount,\n        provider: params.filterProvider,\n        folder: params.activeFolder,\n      });\n      return readCache<CachedSearchData>(key);\n    },\n    []\n  );\n\n  /** Cache a list response. */\n  const cacheListResponse = useCallback(\n    (params: InboxFetchParams, response: EmailListResponse) => {\n      const key = buildInboxCacheKey({\n        page: params.page,\n        limit: params.limit,\n        query: params.query || undefined,\n        after: params.afterDate || undefined,\n        before: params.beforeDate || undefined,\n        accountId: params.filterAccount,\n        provider: params.filterProvider,\n        folder: params.activeFolder,\n      });\n      writeCache<CachedListData>(key, { response });\n    },\n    []\n  );\n\n  /** Cache a search response. */\n  const cacheSearchResponse = useCallback(\n    (params: InboxFetchParams, response: EmailSearchResponse) => {\n      const key = buildInboxCacheKey({\n        page: params.page,\n        limit: params.limit,\n        query: params.query || undefined,\n        after: params.afterDate || undefined,\n        before: params.beforeDate || undefined,\n        accountId: params.filterAccount,\n        provider: params.filterProvider,\n        folder: params.activeFolder,\n      });\n      writeCache<CachedSearchData>(key, { response });\n    },\n    []\n  );\n\n  /** Cache labels. */\n  const getCachedLabels = useCallback(() => {\n    return readCache<{ data: unknown[] }>(buildCacheKey(\"labels\"));\n  }, []);\n\n  const cacheLabels = useCallback((data: unknown[]) => {\n    writeCache(buildCacheKey(\"labels\"), { data });\n  }, []);\n\n  /** Cache accounts. */\n  const getCachedAccounts = useCallback(() => {\n    return readCache<{ accounts: unknown[] }>(buildCacheKey(\"accounts\"));\n  }, []);\n\n  const cacheAccounts = useCallback((accounts: unknown[]) => {\n    writeCache(buildCacheKey(\"accounts\"), { accounts });\n  }, []);\n\n  /** Cache smart labels. */\n  const getCachedSmartLabels = useCallback(() => {\n    return readCache<{ data: unknown[] }>(buildCacheKey(\"smart_labels\"));\n  }, []);\n\n  const cacheSmartLabels = useCallback((data: unknown[]) => {\n    writeCache(buildCacheKey(\"smart_labels\"), { data });\n  }, []);\n\n  /** Invalidate all inbox caches (after sync, delete, classify, etc.) */\n  const invalidateAll = useCallback(() => {\n    clearInboxCache();\n  }, []);\n\n  return {\n    getCachedEmails,\n    getCachedSearch,\n    cacheListResponse,\n    cacheSearchResponse,\n    getCachedLabels,\n    cacheLabels,\n    getCachedAccounts,\n    cacheAccounts,\n    getCachedSmartLabels,\n    cacheSmartLabels,\n    invalidateAll,\n  };\n}\n"
}
Now let me integrate this into the inbox page. I need to read the rest of the page to understand all the mutation points.

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\(app)\\inbox\\page.tsx",
  "offset": 495,
  "limit": 200
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\(app)\\inbox\\page.tsx",
  "offset": 694,
  "limit": 200
}
I have a thorough understanding of the inbox page now. Let me integrate the caching. The key integration points are:

1. **Import and initialize the hook** 
2. **On mount**: Load cached labels/accounts/smart labels instantly, then revalidate
3. **In `fetchEmails`**: Show cached data first (stale-while-revalidate), then update with fresh data
4. **On mutations**: Invalidate cache after sync, classify, detect, delete

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Explore existing inbox codebase structure",
      "status": "completed",
      "activeForm": "Exploring existing inbox codebase structure"
    },
    {
      "content": "Create secure localStorage cache utility (lib/cache/inboxCache.ts)",
      "status": "completed",
      "activeForm": "Creating secure localStorage cache utility"
    },
    {
      "content": "Create useInboxCache hook for React integration",
      "status": "completed",
      "activeForm": "Creating useInboxCache hook"
    },
    {
      "content": "Integrate caching into inbox page component",
      "status": "in_progress",
      "activeForm": "Integrating caching into inbox page component"
    },
    {
      "content": "Add cache invalidation on mutations (delete, sync, classify)",
      "status": "pending",
      "activeForm": "Adding cache invalidation on mutations"
    }
  ]
}
Now let me apply the changes to the inbox page. I'll make targeted edits:

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "C:\\Code\\Krisp\\app\\(app)\\inbox\\page.tsx",
  "old_string": "import { useState, useEffect, useCallback, useRef } from \"react\";\nimport Link from \"next/link\";\nimport { Modal } from \"@/components/ui/Modal\";\nimport { useToast } from \"@/components/ui/Toast\";\nimport type { EmailListItem, EmailListResponse, EmailSearchResponse, EmailSearchItem, EmailLabelChip } from \"@/types/email\";\nimport type { SmartLabelChip, EmailDraft } from \"@/types/smartLabel\";",
  "new_string": "import { useState, useEffect, useCallback, useRef } from \"react\";\nimport Link from \"next/link\";\nimport { Modal } from \"@/components/ui/Modal\";\nimport { useToast } from \"@/components/ui/Toast\";\nimport { useInboxCache } from \"@/lib/hooks/useInboxCache\";\nimport type { EmailListItem, EmailListResponse, EmailSearchResponse, EmailSearchItem, EmailLabelChip } from \"@/types/email\";\nimport type { SmartLabelChip, EmailDraft } from \"@/types/smartLabel\";"
}
Now add the hook initialization right after `const { toast } = useToast();`:

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "C:\\Code\\Krisp\\app\\(app)\\inbox\\page.tsx",
  "old_string": "  const { toast } = useToast();\n  const [emails, setEmails] = useState<EmailListItem[]>([]);\n  const [total, setTotal] = useState(0);",
  "new_string": "  const { toast } = useToast();\n  const cache = useInboxCache();\n  const [emails, setEmails] = useState<EmailListItem[]>([]);\n  const [total, setTotal] = useState(0);"
}
Now update the mount effect to load cached labels/accounts/smart labels instantly, then revalidate:

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "C:\\Code\\Krisp\\app\\(app)\\inbox\\page.tsx",
  "old_string": "  // Fetch labels, smart labels, and connected accounts on mount\n  useEffect(() => {\n    fetch(\"/api/emails/labels\")\n      .then((r) => r.json())\n      .then((d) => { if (d.data) setAllLabels(d.data); })\n      .catch(() => {});\n    fetch(\"/api/emails/accounts\")\n      .then((r) => r.json())\n      .then((d) => { if (d.accounts) setAccounts(d.accounts); })\n      .catch(() => {});\n    fetch(\"/api/smart-labels\")\n      .then((r) => r.json())\n      .then((d) => { if (d.data) setAllSmartLabels(d.data.map((l: { id: string; name: string; color: string }) => ({ id: l.id, name: l.name, color: l.color }))); })\n      .catch(() => {});\n  }, []);",
  "new_string": "  // Fetch labels, smart labels, and connected accounts on mount\n  // Load cached data instantly, then revalidate in the background\n  useEffect(() => {\n    // Restore cached labels\n    const cachedLabels = cache.getCachedLabels();\n    if (cachedLabels?.data) setAllLabels(cachedLabels.data as LabelDef[]);\n    // Restore cached accounts\n    const cachedAccounts = cache.getCachedAccounts();\n    if (cachedAccounts?.accounts) setAccounts(cachedAccounts.accounts as EmailAccount[]);\n    // Restore cached smart labels\n    const cachedSmart = cache.getCachedSmartLabels();\n    if (cachedSmart?.data) setAllSmartLabels(cachedSmart.data as { id: string; name: string; color: string }[]);\n\n    // Revalidate in background\n    fetch(\"/api/emails/labels\")\n      .then((r) => r.json())\n      .then((d) => { if (d.data) { setAllLabels(d.data); cache.cacheLabels(d.data); } })\n      .catch(() => {});\n    fetch(\"/api/emails/accounts\")\n      .then((r) => r.json())\n      .then((d) => { if (d.accounts) { setAccounts(d.accounts); cache.cacheAccounts(d.accounts); } })\n      .catch(() => {});\n    fetch(\"/api/smart-labels\")\n      .then((r) => r.json())\n      .then((d) => { if (d.data) { const mapped = d.data.map((l: { id: string; name: string; color: string }) => ({ id: l.id, name: l.name, color: l.color })); setAllSmartLabels(mapped); cache.cacheSmartLabels(mapped); } })\n      .catch(() => {});\n  // eslint-disable-next-line react-hooks/exhaustive-deps\n  }, []);"
}
Now update the `fetchEmails` function to use stale-while-revalidate:

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "C:\\Code\\Krisp\\app\\(app)\\inbox\\page.tsx",
  "old_string": "  const fetchEmails = useCallback(async (silent = false) => {\n    if (!silent) {\n      setInitialLoading(true);\n      setError(null);\n      setSimilarities({});\n    }\n\n    try {\n      if (query && !afterDate && !beforeDate) {\n        const params = new URLSearchParams();\n        params.set(\"q\", query);\n        params.set(\"limit\", \"20\");\n\n        const res = await fetch(`/api/emails/search?${params}`);\n        if (!res.ok) throw new Error(\"Failed to search emails\");\n        const data: EmailSearchResponse = await res.json();\n        setEmails(data.data);\n        setTotal(data.data.length);\n        setIsSemanticSearch(true);\n        setEmbeddingStatus(data.embedding_status);\n\n        const sims: Record<string | number, number> = {};\n        for (const item of data.data as EmailSearchItem[]) {\n          sims[item.id] = item.similarity;\n        }\n        setSimilarities(sims);\n      } else {\n        const params = new URLSearchParams();\n        params.set(\"page\", String(page));\n        params.set(\"limit\", String(limit));\n        if (query) params.set(\"q\", query);\n        if (afterDate) params.set(\"after\", new Date(afterDate).toISOString());\n        if (beforeDate) params.set(\"before\", new Date(beforeDate).toISOString());\n        if (filterAccount) params.set(\"accountId\", filterAccount);\n        if (filterProvider) params.set(\"provider\", filterProvider);\n        if (activeFolder !== \"all\") params.set(\"folder\", activeFolder);\n\n        const res = await fetch(`/api/emails?${params}`);\n        if (!res.ok) throw new Error(\"Failed to fetch emails\");\n        const data: EmailListResponse = await res.json();\n        setEmails(data.data);\n        setTotal(data.total);\n        setIsSemanticSearch(false);\n        setEmbeddingStatus(null);\n      }\n    } catch {\n      if (!silent) {\n        setError(\"Failed to load emails. Please try again.\");\n      }\n    } finally {\n      if (!silent) {\n        setInitialLoading(false);\n        hasFetchedOnce.current = true;\n      }\n    }\n  }, [page, limit, query, afterDate, beforeDate, filterAccount, filterProvider, activeFolder]);",
  "new_string": "  const fetchEmails = useCallback(async (silent = false) => {\n    const fetchParams = { page, limit, query, afterDate, beforeDate, filterAccount, filterProvider, activeFolder };\n\n    if (!silent) {\n      setError(null);\n      setSimilarities({});\n\n      // Stale-while-revalidate: show cached data immediately to avoid loading flash\n      if (query && !afterDate && !beforeDate) {\n        const cached = cache.getCachedSearch(fetchParams);\n        if (cached) {\n          setEmails(cached.response.data);\n          setTotal(cached.response.data.length);\n          setIsSemanticSearch(true);\n          setEmbeddingStatus(cached.response.embedding_status);\n          const sims: Record<string | number, number> = {};\n          for (const item of cached.response.data as EmailSearchItem[]) {\n            sims[item.id] = item.similarity;\n          }\n          setSimilarities(sims);\n          // Skip loading state — we have cached data, will revalidate below\n        } else {\n          setInitialLoading(true);\n        }\n      } else {\n        const cached = cache.getCachedEmails(fetchParams);\n        if (cached) {\n          setEmails(cached.response.data);\n          setTotal(cached.response.total);\n          setIsSemanticSearch(false);\n          setEmbeddingStatus(null);\n        } else {\n          setInitialLoading(true);\n        }\n      }\n    }\n\n    try {\n      if (query && !afterDate && !beforeDate) {\n        const params = new URLSearchParams();\n        params.set(\"q\", query);\n        params.set(\"limit\", \"20\");\n\n        const res = await fetch(`/api/emails/search?${params}`);\n        if (!res.ok) throw new Error(\"Failed to search emails\");\n        const data: EmailSearchResponse = await res.json();\n        setEmails(data.data);\n        setTotal(data.data.length);\n        setIsSemanticSearch(true);\n        setEmbeddingStatus(data.embedding_status);\n\n        const sims: Record<string | number, number> = {};\n        for (const item of data.data as EmailSearchItem[]) {\n          sims[item.id] = item.similarity;\n        }\n        setSimilarities(sims);\n        cache.cacheSearchResponse(fetchParams, data);\n      } else {\n        const params = new URLSearchParams();\n        params.set(\"page\", String(page));\n        params.set(\"limit\", String(limit));\n        if (query) params.set(\"q\", query);\n        if (afterDate) params.set(\"after\", new Date(afterDate).toISOString());\n        if (beforeDate) params.set(\"before\", new Date(beforeDate).toISOString());\n        if (filterAccount) params.set(\"accountId\", filterAccount);\n        if (filterProvider) params.set(\"provider\", filterProvider);\n        if (activeFolder !== \"all\") params.set(\"folder\", activeFolder);\n\n        const res = await fetch(`/api/emails?${params}`);\n        if (!res.ok) throw new Error(\"Failed to fetch emails\");\n        const data: EmailListResponse = await res.json();\n        setEmails(data.data);\n        setTotal(data.total);\n        setIsSemanticSearch(false);\n        setEmbeddingStatus(null);\n        cache.cacheListResponse(fetchParams, data);\n      }\n    } catch {\n      if (!silent) {\n        setError(\"Failed to load emails. Please try again.\");\n      }\n    } finally {\n      if (!silent) {\n        setInitialLoading(false);\n        hasFetchedOnce.current = true;\n      }\n    }\n  }, [page, limit, query, afterDate, beforeDate, filterAccount, filterProvider, activeFolder, cache]);"
}
Now add cache invalidation after mutations. Let me update the sync handler:

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Explore existing inbox codebase structure",
      "status": "completed",
      "activeForm": "Exploring existing inbox codebase structure"
    },
    {
      "content": "Create secure localStorage cache utility (lib/cache/inboxCache.ts)",
      "status": "completed",
      "activeForm": "Creating secure localStorage cache utility"
    },
    {
      "content": "Create useInboxCache hook for React integration",
      "status": "completed",
      "activeForm": "Creating useInboxCache hook"
    },
    {
      "content": "Integrate caching into inbox page component",
      "status": "completed",
      "activeForm": "Integrating caching into inbox page component"
    },
    {
      "content": "Add cache invalidation on mutations (delete, sync, classify)",
      "status": "in_progress",
      "activeForm": "Adding cache invalidation on mutations"
    }
  ]
}

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "C:\\Code\\Krisp\\app\\(app)\\inbox\\page.tsx",
  "old_string": "      if (totalInserted > 0) {\n        toast({ title: \"Sync complete\", description: `${totalInserted} new messages synced` });\n        fetchEmails(false);\n      } else {\n        toast({ title: \"Sync complete\", description: \"No new messages\" });\n      }",
  "new_string": "      if (totalInserted > 0) {\n        cache.invalidateAll();\n        toast({ title: \"Sync complete\", description: `${totalInserted} new messages synced` });\n        fetchEmails(false);\n      } else {\n        toast({ title: \"Sync complete\", description: \"No new messages\" });\n      }"
}
Now invalidate after classify:

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "C:\\Code\\Krisp\\app\\(app)\\inbox\\page.tsx",
  "old_string": "      toast({\n        title: \"Classification complete\",\n        description: `${data.total} emails checked, ${data.classified} labeled`,\n        variant: \"success\",\n      });\n      // Refresh to show new labels\n      hasFetchedOnce.current = false;\n      fetchEmails(false);",
  "new_string": "      cache.invalidateAll();\n      toast({\n        title: \"Classification complete\",\n        description: `${data.total} emails checked, ${data.classified} labeled`,\n        variant: \"success\",\n      });\n      // Refresh to show new labels\n      hasFetchedOnce.current = false;\n      fetchEmails(false);"
}
Invalidate after newsletter detection:

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "C:\\Code\\Krisp\\app\\(app)\\inbox\\page.tsx",
  "old_string": "      toast({\n        title: \"Newsletter detection complete\",\n        description: `${data.marked} newsletters detected, ${data.whitelisted} whitelisted senders skipped`,\n        variant: \"success\",\n      });\n      hasFetchedOnce.current = false;\n      fetchEmails(false);",
  "new_string": "      cache.invalidateAll();\n      toast({\n        title: \"Newsletter detection complete\",\n        description: `${data.marked} newsletters detected, ${data.whitelisted} whitelisted senders skipped`,\n        variant: \"success\",\n      });\n      hasFetchedOnce.current = false;\n      fetchEmails(false);"
}
Invalidate after spam detection:

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "C:\\Code\\Krisp\\app\\(app)\\inbox\\page.tsx",
  "old_string": "      toast({\n        title: \"Spam detection complete\",\n        description: `${data.marked} spam emails detected out of ${data.total} scanned`,\n        variant: \"success\",\n      });\n      hasFetchedOnce.current = false;\n      fetchEmails(false);",
  "new_string": "      cache.invalidateAll();\n      toast({\n        title: \"Spam detection complete\",\n        description: `${data.marked} spam emails detected out of ${data.total} scanned`,\n        variant: \"success\",\n      });\n      hasFetchedOnce.current = false;\n      fetchEmails(false);"
}
Now invalidate after successful delete:

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "C:\\Code\\Krisp\\app\\(app)\\inbox\\page.tsx",
  "old_string": "      const res = await fetch(`/api/emails/${emailId}`, { method: \"DELETE\" });\n      if (!res.ok) {\n        const body = await res.json().catch(() => ({}));\n        throw new Error(body.error || \"Failed to delete\");\n      }\n      toast({ title: \"Email deleted\", variant: \"success\" });",
  "new_string": "      const res = await fetch(`/api/emails/${emailId}`, { method: \"DELETE\" });\n      if (!res.ok) {\n        const body = await res.json().catch(() => ({}));\n        throw new Error(body.error || \"Failed to delete\");\n      }\n      cache.invalidateAll();\n      toast({ title: \"Email deleted\", variant: \"success\" });"
}
Now let me verify the complete changes look correct by reading the key sections:

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\(app)\\inbox\\page.tsx",
  "limit": 10
}
Let me verify the fetchEmails integration and the mount effect look clean:

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\(app)\\inbox\\page.tsx",
  "offset": 167,
  "limit": 20
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\app\\(app)\\inbox\\page.tsx",
  "offset": 236,
  "limit": 100
}
The integration looks clean. Let me also check there are no issues with the `cache` reference stability in the `useCallback` dependency — the `useInboxCache` hook returns new objects on every render. Let me fix this by making the hook return stable references using `useCallback` (which it already does). But the `cache` object itself will be a new object reference each render, which could cause issues with the `useCallback` dependency for `fetchEmails`. Let me refactor to avoid this:

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\lib\\hooks\\useInboxCache.ts"
}
The individual functions inside the hook are all wrapped in `useCallback` with `[]` deps, so they have stable identities. But the return object `{ getCachedEmails, ... }` is a new object each render. When `fetchEmails` depends on `cache`, it will re-create on every render. I need to either use `useMemo` for the return value, or better, destructure the cache methods directly. Let me fix the hook to return a stable object:

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "C:\\Code\\Krisp\\lib\\hooks\\useInboxCache.ts",
  "old_string": "import { useCallback, useRef } from \"react\";",
  "new_string": "import { useCallback, useMemo, useRef } from \"react\";"
}

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "C:\\Code\\Krisp\\lib\\hooks\\useInboxCache.ts",
  "old_string": "  return {\n    getCachedEmails,\n    getCachedSearch,\n    cacheListResponse,\n    cacheSearchResponse,\n    getCachedLabels,\n    cacheLabels,\n    getCachedAccounts,\n    cacheAccounts,\n    getCachedSmartLabels,\n    cacheSmartLabels,\n    invalidateAll,\n  };",
  "new_string": "  return useMemo(() => ({\n    getCachedEmails,\n    getCachedSearch,\n    cacheListResponse,\n    cacheSearchResponse,\n    getCachedLabels,\n    cacheLabels,\n    getCachedAccounts,\n    cacheAccounts,\n    getCachedSmartLabels,\n    cacheSmartLabels,\n    invalidateAll,\n  }), [\n    getCachedEmails,\n    getCachedSearch,\n    cacheListResponse,\n    cacheSearchResponse,\n    getCachedLabels,\n    cacheLabels,\n    getCachedAccounts,\n    cacheAccounts,\n    getCachedSmartLabels,\n    cacheSmartLabels,\n    invalidateAll,\n  ]);"
}
Now let me also remove the unused `lastCacheKeyRef` since it's not actually being used for anything meaningful:

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "C:\\Code\\Krisp\\lib\\hooks\\useInboxCache.ts",
  "old_string": "export function useInboxCache() {\n  const lastCacheKeyRef = useRef<string>(\"\");\n\n  /** Try to read cached list data for the given params. */\n  const getCachedEmails = useCallback(\n    (params: InboxFetchParams): CachedListData | null => {\n      const key = buildInboxCacheKey({\n        page: params.page,\n        limit: params.limit,\n        query: params.query || undefined,\n        after: params.afterDate || undefined,\n        before: params.beforeDate || undefined,\n        accountId: params.filterAccount,\n        provider: params.filterProvider,\n        folder: params.activeFolder,\n      });\n      lastCacheKeyRef.current = key;\n\n      if (params.query && !params.afterDate && !params.beforeDate) {",
  "new_string": "export function useInboxCache() {\n  /** Try to read cached list data for the given params. */\n  const getCachedEmails = useCallback(\n    (params: InboxFetchParams): CachedListData | null => {\n      const key = buildInboxCacheKey({\n        page: params.page,\n        limit: params.limit,\n        query: params.query || undefined,\n        after: params.afterDate || undefined,\n        before: params.beforeDate || undefined,\n        accountId: params.filterAccount,\n        provider: params.filterProvider,\n        folder: params.activeFolder,\n      });\n\n      if (params.query && !params.afterDate && !params.beforeDate) {"
}
Also remove the unused `useRef` import:

🔧 Tool: Edit
Input: {
  "replace_all": false,
  "file_path": "C:\\Code\\Krisp\\lib\\hooks\\useInboxCache.ts",
  "old_string": "import { useCallback, useMemo, useRef } from \"react\";",
  "new_string": "import { useCallback, useMemo } from \"react\";"
}
Now let me verify the build compiles correctly:

🔧 Tool: Bash
Input: {
  "command": "cd C:/Code/Krisp && npx tsc --noEmit --pretty 2>&1 | head -50",
  "description": "Type-check the project",
  "timeout": 120000
}
The only type error is a pre-existing issue in a different file (forward route), not in my changes. The inbox cache files compile cleanly.

Let me also verify the cache files themselves have no issues:

🔧 Tool: Bash
Input: {
  "command": "cd C:/Code/Krisp && npx tsc --noEmit --pretty lib/cache/inboxCache.ts lib/hooks/useInboxCache.ts 2>&1",
  "description": "Type-check new cache files specifically",
  "timeout": 60000
}
That's just a path alias issue when checking individual files outside the full tsconfig context. The full project check (`npx tsc --noEmit`) passed my files (only the pre-existing forward/route error remains). 

Let me do a final review of all three files:

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\lib\\cache\\inboxCache.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "C:\\Code\\Krisp\\lib\\hooks\\useInboxCache.ts"
}
Everything looks solid. Let me update the todos and provide the final summary.

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Explore existing inbox codebase structure",
      "status": "completed",
      "activeForm": "Exploring existing inbox codebase structure"
    },
    {
      "content": "Create secure localStorage cache utility (lib/cache/inboxCache.ts)",
      "status": "completed",
      "activeForm": "Creating secure localStorage cache utility"
    },
    {
      "content": "Create useInboxCache hook for React integration",
      "status": "completed",
      "activeForm": "Creating useInboxCache hook"
    },
    {
      "content": "Integrate caching into inbox page component",
      "status": "completed",
      "activeForm": "Integrating caching into inbox page component"
    },
    {
      "content": "Add cache invalidation on mutations (delete, sync, classify)",
      "status": "completed",
      "activeForm": "Adding cache invalidation on mutations"
    }
  ]
}
<summary>
## Summary: Inbox localStorage Cache for Performance

### Changes Implemented
- Created a secure localStorage caching layer for inbox data using a **stale-while-revalidate** pattern
- **Cache utility** (`lib/cache/inboxCache.ts`): TTL-based (5 min) cache with version keys, automatic eviction of oldest entries (max 20), and graceful handling of localStorage errors/corruption
- **React hook** (`lib/hooks/useInboxCache.ts`): Provides `getCachedEmails`, `getCachedSearch`, `cacheListResponse`, `cacheSearchResponse`, and caching for labels/accounts/smart labels — all with stable references via `useMemo`/`useCallback`
- **Inbox page integration**: On page load, cached data renders immediately (no loading spinner flash), then fresh data is fetched in background and replaces it. Applies to:
  - Email list (paginated)
  - Semantic search results
  - Labels, accounts, and smart labels (loaded on mount)
- **Cache invalidation**: All inbox cache is cleared after mutations that change data:
  - Email sync (Outlook + Gmail)
  - Email delete (optimistic UI + cache clear)
  - AI classification
  - Newsletter detection
  - Spam detection
- **Security considerations**: Only list-level data is cached (sender, subject, preview) — no body/HTML content. Cache is keyed per filter combination so different views don't interfere. TTL ensures stale data expires within 5 minutes. Cache is namespaced with version prefix for easy busting on schema changes.

### Files Modified
- `app/(app)/inbox/page.tsx` — Added `useInboxCache` hook, stale-while-revalidate in `fetchEmails`, cached mount data for labels/accounts/smart labels, cache invalidation on all mutation handlers

### Files Created
- `lib/cache/inboxCache.ts` — Core localStorage cache utility with TTL, versioning, eviction, and error handling
- `lib/hooks/useInboxCache.ts` — React hook wrapping cache operations for inbox data

### Notes for Developer
- The cache TTL is 5 minutes (`DEFAULT_TTL_MS`). Adjust in `lib/cache/inboxCache.ts` if needed.
- Max 20 cache entries are stored. Older entries are evicted automatically.
- Bump `CACHE_VERSION` in `lib/cache/inboxCache.ts` to invalidate all existing caches after schema changes.
- Background polling (every 15s on page 1) still works and updates the cache silently.
- The pre-existing type error in `app/api/emails/[id]/forward/route.ts:86` is unrelated to these changes.
</summary>