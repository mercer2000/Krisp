/**
 * Secure localStorage cache for inbox data.
 *
 * Design decisions:
 * - TTL-based expiry (default 5 minutes) so stale data is never shown for long
 * - Version key allows cache busting on schema changes
 * - Size-bounded: evicts oldest entries when total exceeds limit
 * - Only caches list-level data (EmailListItem[]) — no body/HTML content
 * - Keyed by filter params so each view has its own cache entry
 */

const CACHE_PREFIX = "krisp_inbox_";
const CACHE_VERSION = 1;
const DEFAULT_TTL_MS = 5 * 60 * 1000; // 5 minutes
const MAX_CACHE_ENTRIES = 20;

interface CacheEntry<T> {
  version: number;
  timestamp: number;
  data: T;
}

function cacheKey(suffix: string): string {
  return `${CACHE_PREFIX}v${CACHE_VERSION}_${suffix}`;
}

/** Build a deterministic key from inbox query params. */
export function buildInboxCacheKey(params: {
  page?: number;
  limit?: number;
  query?: string;
  after?: string;
  before?: string;
  accountId?: string | null;
  provider?: string | null;
  folder?: string;
}): string {
  const parts = [
    `p${params.page ?? 1}`,
    `l${params.limit ?? 50}`,
    params.query ? `q${params.query}` : "",
    params.after ? `a${params.after}` : "",
    params.before ? `b${params.before}` : "",
    params.accountId ? `acc${params.accountId}` : "",
    params.provider ? `prov${params.provider}` : "",
    params.folder && params.folder !== "all" ? `f${params.folder}` : "",
  ]
    .filter(Boolean)
    .join("_");
  return cacheKey(`list_${parts}`);
}

export function buildCacheKey(namespace: string): string {
  return cacheKey(namespace);
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
    // Corrupted entry — remove it
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
    // localStorage full or unavailable — silently skip
  }
}

/** Remove a specific cache entry. */
export function removeCache(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {}
}

/** Remove all inbox cache entries (e.g. after a sync or mutation). */
export function clearInboxCache(): void {
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

/** Evict oldest inbox entries when we have too many. */
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
          // Corrupted — remove
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
