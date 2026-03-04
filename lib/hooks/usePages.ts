"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Page, PageWithBlocks, Workspace } from "@/types";

async function fetchJSON<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export function useWorkspaces() {
  return useQuery<Workspace[]>({
    queryKey: ["workspaces"],
    queryFn: () => fetchJSON("/api/pages/workspaces"),
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
    onSuccess: () => qc.invalidateQueries({ queryKey: ["workspaces"] }),
  });
}

export function usePages(workspaceId: string | undefined) {
  return useQuery<Page[]>({
    queryKey: ["pages", workspaceId],
    queryFn: () => fetchJSON(`/api/pages?workspace_id=${workspaceId}`),
    enabled: !!workspaceId,
  });
}

export function usePage(pageId: string | undefined) {
  return useQuery<PageWithBlocks>({
    queryKey: ["page", pageId],
    queryFn: () => fetchJSON(`/api/pages/${pageId}`),
    enabled: !!pageId,
  });
}

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
    }) =>
      fetchJSON<Page>("/api/pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: (_, vars) => {
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
    }) =>
      fetchJSON<Page>(`/api/pages/${pageId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: (page) => {
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
