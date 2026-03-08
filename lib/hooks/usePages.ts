"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Page, PageWithBlocks, PageEntry, PageWithEntries, Workspace, PageType } from "@/types";
import {
  buildWorkspacesKey,
  buildPagesListKey,
  buildPageKey,
  readCache,
  writeCache,
  removeCache,
  clearDrafts,
  DEFAULT_TTL_MS,
  PAGE_TTL_MS,
} from "@/lib/cache/pagesCache";

async function fetchJSON<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

// ── Helper: safely read cache (SSR-safe) ──────────────────────────────────

function safeReadCache<T>(key: string, ttl?: number): T | undefined {
  if (typeof window === "undefined") return undefined;
  return readCache<T>(key, ttl) ?? undefined;
}

function safeWriteCache<T>(key: string, data: T): void {
  if (typeof window === "undefined") return;
  writeCache(key, data);
}

// ── Workspace hooks ──────────────────────────────────────────────────────────

export function useWorkspaces() {
  return useQuery<Workspace[]>({
    queryKey: ["workspaces"],
    queryFn: async () => {
      const data = await fetchJSON<Workspace[]>("/api/pages/workspaces");
      safeWriteCache(buildWorkspacesKey(), data);
      return data;
    },
    initialData: () => safeReadCache<Workspace[]>(buildWorkspacesKey()),
    initialDataUpdatedAt: () => {
      // Let React Query know the initial data may be stale
      // so it still fetches in the background
      return 0;
    },
  });
}

export function useCreateWorkspace() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string }) =>
      fetchJSON<Workspace>("/api/pages/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      removeCache(buildWorkspacesKey());
      qc.invalidateQueries({ queryKey: ["workspaces"] });
    },
  });
}

// ── Page list hooks ──────────────────────────────────────────────────────────

export function usePages(workspaceId: string | undefined) {
  return useQuery<Page[]>({
    queryKey: ["pages", workspaceId],
    queryFn: async () => {
      const data = await fetchJSON<Page[]>(`/api/pages?workspace_id=${workspaceId}`);
      if (workspaceId) safeWriteCache(buildPagesListKey(workspaceId), data);
      return data;
    },
    enabled: !!workspaceId,
    initialData: () =>
      workspaceId ? safeReadCache<Page[]>(buildPagesListKey(workspaceId)) : undefined,
    initialDataUpdatedAt: () => 0,
  });
}

export function usePage(pageId: string | undefined) {
  return useQuery<PageWithBlocks & { entries?: PageEntry[]; entryCount?: number }>({
    queryKey: ["page", pageId],
    queryFn: async () => {
      const data = await fetchJSON<PageWithBlocks & { entries?: PageEntry[]; entryCount?: number }>(
        `/api/pages/${pageId}`
      );
      if (pageId) safeWriteCache(buildPageKey(pageId), data);
      return data;
    },
    enabled: !!pageId,
    initialData: () =>
      pageId
        ? safeReadCache<PageWithBlocks & { entries?: PageEntry[]; entryCount?: number }>(
            buildPageKey(pageId),
            PAGE_TTL_MS
          )
        : undefined,
    initialDataUpdatedAt: () => 0,
  });
}

// ── Page mutation hooks ──────────────────────────────────────────────────────

export function useCreatePage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      workspace_id: string;
      parent_id?: string;
      title?: string;
      icon?: string;
      is_database?: boolean;
      database_config?: unknown;
      page_type?: PageType;
      color?: string | null;
      smart_rule?: string | null;
      smart_active?: boolean;
    }) =>
      fetchJSON<Page>("/api/pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: (_, vars) => {
      removeCache(buildPagesListKey(vars.workspace_id));
      qc.invalidateQueries({ queryKey: ["pages", vars.workspace_id] });
    },
  });
}

export function useUpdatePage(pageId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      title?: string;
      icon?: string;
      cover_url?: string;
      parent_id?: string | null;
      sort_order?: number;
      is_archived?: boolean;
      database_config?: unknown;
      page_type?: PageType;
      color?: string | null;
      smart_rule?: string | null;
      smart_active?: boolean;
    }) =>
      fetchJSON<Page>(`/api/pages/${pageId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: (page) => {
      removeCache(buildPagesListKey(page.workspaceId));
      removeCache(buildPageKey(pageId));
      qc.invalidateQueries({ queryKey: ["pages", page.workspaceId] });
      qc.invalidateQueries({ queryKey: ["page", pageId] });
    },
  });
}

export function useDeletePage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { pageId: string; workspaceId: string }) =>
      fetchJSON(`/api/pages/${data.pageId}`, { method: "DELETE" }),
    onSuccess: (_, vars) => {
      removeCache(buildPagesListKey(vars.workspaceId));
      removeCache(buildPageKey(vars.pageId));
      clearDrafts(vars.pageId);
      qc.invalidateQueries({ queryKey: ["pages", vars.workspaceId] });
    },
  });
}

export function useSearchPages(workspaceId: string | undefined, query: string) {
  return useQuery<Page[]>({
    queryKey: ["pages-search", workspaceId, query],
    queryFn: () =>
      fetchJSON(
        `/api/pages/search?workspace_id=${workspaceId}&q=${encodeURIComponent(query)}`
      ),
    enabled: !!workspaceId && query.length > 0,
  });
}

// ── Page Entries hooks ──────────────────────────────

export function usePageEntries(pageId: string | undefined, entryType?: string) {
  const params = new URLSearchParams();
  if (entryType) params.set("entry_type", entryType);
  return useQuery<{ entries: PageEntry[]; total: number }>({
    queryKey: ["page-entries", pageId, entryType],
    queryFn: () => fetchJSON(`/api/pages/${pageId}/entries?${params}`),
    enabled: !!pageId,
  });
}

export function useCreatePageEntry(pageId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      entry_type: "knowledge" | "decision" | "email_summary" | "manual";
      title?: string;
      content?: string;
      metadata?: Record<string, unknown>;
      source_id?: string;
      source_type?: string;
      confidence?: number;
    }) =>
      fetchJSON<PageEntry>(`/api/pages/${pageId}/entries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      removeCache(buildPageKey(pageId));
      qc.invalidateQueries({ queryKey: ["page-entries", pageId] });
      qc.invalidateQueries({ queryKey: ["page", pageId] });
    },
  });
}

export function useUpdatePageEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      entryId: string;
      title?: string;
      content?: string;
      metadata?: Record<string, unknown>;
    }) =>
      fetchJSON<PageEntry>(`/api/pages/entries/${data.entryId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["page-entries"] });
      qc.invalidateQueries({ queryKey: ["page"] });
    },
  });
}

export function useDeletePageEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (entryId: string) =>
      fetchJSON(`/api/pages/entries/${entryId}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["page-entries"] });
      qc.invalidateQueries({ queryKey: ["page"] });
    },
  });
}
