"use client";

import { useCallback, useMemo } from "react";
import {
  buildInboxCacheKey,
  buildCacheKey,
  readCache,
  writeCache,
  clearInboxCache,
} from "@/lib/cache/inboxCache";
import type { EmailListResponse, EmailSearchResponse } from "@/types/email";

interface InboxFetchParams {
  page: number;
  limit: number;
  query: string;
  afterDate: string;
  beforeDate: string;
  filterAccount: string | null;
  filterProvider: "outlook" | "gmail" | "zoom" | null;
  activeFolder: "inbox" | "spam" | "done" | "all";
}

interface CachedListData {
  response: EmailListResponse;
}

interface CachedSearchData {
  response: EmailSearchResponse;
}

/**
 * Hook that provides stale-while-revalidate caching for inbox data.
 *
 * On mount / filter change:
 * 1. Check localStorage for cached data matching the current filters
 * 2. If found, render immediately (no loading spinner)
 * 3. Fetch fresh data in the background
 * 4. Update UI + cache when fresh data arrives
 *
 * This eliminates the loading flash when revisiting the inbox or
 * switching between pages/folders the user has already seen.
 */
export function useInboxCache() {
  /** Try to read cached list data for the given params. */
  const getCachedEmails = useCallback(
    (params: InboxFetchParams): CachedListData | null => {
      const key = buildInboxCacheKey({
        page: params.page,
        limit: params.limit,
        query: params.query || undefined,
        after: params.afterDate || undefined,
        before: params.beforeDate || undefined,
        accountId: params.filterAccount,
        provider: params.filterProvider,
        folder: params.activeFolder,
      });

      if (params.query && !params.afterDate && !params.beforeDate) {
        // Semantic search — use search cache
        const cached = readCache<CachedSearchData>(key);
        if (cached) {
          return {
            response: {
              data: cached.response.data,
              total: cached.response.data.length,
              page: 1,
              limit: params.limit,
            },
          };
        }
        return null;
      }

      return readCache<CachedListData>(key);
    },
    []
  );

  /** Try to read cached search data for the given params. */
  const getCachedSearch = useCallback(
    (params: InboxFetchParams): CachedSearchData | null => {
      const key = buildInboxCacheKey({
        page: params.page,
        limit: params.limit,
        query: params.query || undefined,
        after: params.afterDate || undefined,
        before: params.beforeDate || undefined,
        accountId: params.filterAccount,
        provider: params.filterProvider,
        folder: params.activeFolder,
      });
      return readCache<CachedSearchData>(key);
    },
    []
  );

  /** Cache a list response. */
  const cacheListResponse = useCallback(
    (params: InboxFetchParams, response: EmailListResponse) => {
      const key = buildInboxCacheKey({
        page: params.page,
        limit: params.limit,
        query: params.query || undefined,
        after: params.afterDate || undefined,
        before: params.beforeDate || undefined,
        accountId: params.filterAccount,
        provider: params.filterProvider,
        folder: params.activeFolder,
      });
      writeCache<CachedListData>(key, { response });
    },
    []
  );

  /** Cache a search response. */
  const cacheSearchResponse = useCallback(
    (params: InboxFetchParams, response: EmailSearchResponse) => {
      const key = buildInboxCacheKey({
        page: params.page,
        limit: params.limit,
        query: params.query || undefined,
        after: params.afterDate || undefined,
        before: params.beforeDate || undefined,
        accountId: params.filterAccount,
        provider: params.filterProvider,
        folder: params.activeFolder,
      });
      writeCache<CachedSearchData>(key, { response });
    },
    []
  );

  /** Cache labels. */
  const getCachedLabels = useCallback(() => {
    return readCache<{ data: unknown[] }>(buildCacheKey("labels"));
  }, []);

  const cacheLabels = useCallback((data: unknown[]) => {
    writeCache(buildCacheKey("labels"), { data });
  }, []);

  /** Cache accounts. */
  const getCachedAccounts = useCallback(() => {
    return readCache<{ accounts: unknown[] }>(buildCacheKey("accounts"));
  }, []);

  const cacheAccounts = useCallback((accounts: unknown[]) => {
    writeCache(buildCacheKey("accounts"), { accounts });
  }, []);

  /** Cache smart labels. */
  const getCachedSmartLabels = useCallback(() => {
    return readCache<{ data: unknown[] }>(buildCacheKey("smart_labels"));
  }, []);

  const cacheSmartLabels = useCallback((data: unknown[]) => {
    writeCache(buildCacheKey("smart_labels"), { data });
  }, []);

  /** Invalidate all inbox caches (after sync, delete, classify, etc.) */
  const invalidateAll = useCallback(() => {
    clearInboxCache();
  }, []);

  return useMemo(() => ({
    getCachedEmails,
    getCachedSearch,
    cacheListResponse,
    cacheSearchResponse,
    getCachedLabels,
    cacheLabels,
    getCachedAccounts,
    cacheAccounts,
    getCachedSmartLabels,
    cacheSmartLabels,
    invalidateAll,
  }), [
    getCachedEmails,
    getCachedSearch,
    cacheListResponse,
    cacheSearchResponse,
    getCachedLabels,
    cacheLabels,
    getCachedAccounts,
    cacheAccounts,
    getCachedSmartLabels,
    cacheSmartLabels,
    invalidateAll,
  ]);
}
