/**
 * Secure localStorage cache for Pages data.
 *
 * Design decisions:
 * - TTL-based expiry (5 min for lists, 10 min for single pages) so stale data is never shown long
 * - Version key allows cache busting on schema changes
 * - Size-bounded: evicts oldest entries when total exceeds limit
 * - Caches page lists and single-page data (blocks + entries) for instant navigation
 * - Caches unsaved block edits so content isn't lost on accidental navigation/refresh
 */

const CACHE_PREFIX = "krisp_pages_";
const CACHE_VERSION = 1;
const DEFAULT_TTL_MS = 5 * 60 * 1000; // 5 minutes
const PAGE_TTL_MS = 10 * 60 * 1000; // 10 minutes for single pages
const DRAFT_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours for unsaved drafts
const MAX_CACHE_ENTRIES = 50;

interface CacheEntry<T> {
  version: number;
  timestamp: number;
  data: T;
}

function cacheKey(suffix: string): string {
  return `${CACHE_PREFIX}v${CACHE_VERSION}_${suffix}`;
}

/** Build a cache key for a pages list within a workspace. */
export function buildPagesListKey(workspaceId: string): string {
  return cacheKey(`list_${workspaceId}`);
}

/** Build a cache key for a single page with blocks/entries. */
export function buildPageKey(pageId: string): string {
  return cacheKey(`page_${pageId}`);
}

/** Build a cache key for unsaved block drafts. */
export function buildDraftKey(pageId: string): string {
  return cacheKey(`draft_${pageId}`);
}

/** Build a cache key for workspaces list. */
export function buildWorkspacesKey(): string {
  return cacheKey("workspaces");
}

/** Read a cache entry. Returns null if missing, expired, or wrong version. */
export function readCache<T>(key: string, ttlMs = DEFAULT_TTL_MS): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;

    const entry: CacheEntry<T> = JSON.parse(raw);
    if (entry.version !== CACHE_VERSION) {
      localStorage.removeItem(key);
      return null;
    }
    if (Date.now() - entry.timestamp > ttlMs) {
      localStorage.removeItem(key);
      return null;
    }
    return entry.data;
  } catch {
    // Corrupted entry - remove it
    try { localStorage.removeItem(key); } catch {}
    return null;
  }
}

/** Write a cache entry. Evicts oldest entries if over the limit. */
export function writeCache<T>(key: string, data: T): void {
  try {
    const entry: CacheEntry<T> = {
      version: CACHE_VERSION,
      timestamp: Date.now(),
      data,
    };
    evictIfNeeded();
    localStorage.setItem(key, JSON.stringify(entry));
  } catch {
    // localStorage full or unavailable - silently skip
  }
}

/** Remove a specific cache entry. */
export function removeCache(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {}
}

/** Remove all pages cache entries (e.g. after a major mutation). */
export function clearPagesCache(): void {
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(CACHE_PREFIX)) {
        keysToRemove.push(k);
      }
    }
    for (const k of keysToRemove) {
      localStorage.removeItem(k);
    }
  } catch {}
}

/** Evict oldest pages entries when we have too many. */
function evictIfNeeded(): void {
  try {
    const entries: { key: string; timestamp: number }[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(CACHE_PREFIX)) {
        try {
          const raw = localStorage.getItem(k);
          if (raw) {
            const parsed = JSON.parse(raw);
            entries.push({ key: k, timestamp: parsed.timestamp ?? 0 });
          }
        } catch {
          // Corrupted - remove
          localStorage.removeItem(k);
        }
      }
    }
    // Evict oldest entries beyond the limit
    if (entries.length >= MAX_CACHE_ENTRIES) {
      entries.sort((a, b) => a.timestamp - b.timestamp);
      const toRemove = entries.slice(0, entries.length - MAX_CACHE_ENTRIES + 1);
      for (const e of toRemove) {
        localStorage.removeItem(e.key);
      }
    }
  } catch {}
}

// ── Draft (unsaved block edits) helpers ──────────────────────────────────────

export interface BlockDraft {
  blockId: string;
  content: Record<string, unknown>;
  type?: string;
  savedAt: number;
}

/** Save an unsaved block edit to localStorage. */
export function saveDraft(pageId: string, draft: Omit<BlockDraft, "savedAt">): void {
  const key = buildDraftKey(pageId);
  try {
    const existing = readCache<Record<string, BlockDraft>>(key, DRAFT_TTL_MS) ?? {};
    existing[draft.blockId] = { ...draft, savedAt: Date.now() };
    writeCache(key, existing);
  } catch {}
}

/** Read all unsaved drafts for a page. */
export function readDrafts(pageId: string): Record<string, BlockDraft> | null {
  return readCache<Record<string, BlockDraft>>(buildDraftKey(pageId), DRAFT_TTL_MS);
}

/** Clear drafts for a page (after successful save). */
export function clearDrafts(pageId: string): void {
  removeCache(buildDraftKey(pageId));
}

/** Clear a single block's draft after it's been saved successfully. */
export function clearBlockDraft(pageId: string, blockId: string): void {
  const key = buildDraftKey(pageId);
  try {
    const existing = readCache<Record<string, BlockDraft>>(key, DRAFT_TTL_MS);
    if (existing && existing[blockId]) {
      delete existing[blockId];
      if (Object.keys(existing).length === 0) {
        removeCache(key);
      } else {
        writeCache(key, existing);
      }
    }
  } catch {}
}

/** Check if there are any unsaved drafts for a page. */
export function hasDrafts(pageId: string): boolean {
  const drafts = readDrafts(pageId);
  return drafts !== null && Object.keys(drafts).length > 0;
}

// Re-export TTL constants for use in hooks
export { DEFAULT_TTL_MS, PAGE_TTL_MS, DRAFT_TTL_MS };
