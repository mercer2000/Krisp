"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { DatabaseRow } from "@/types";

async function fetchJSON<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export function useDatabaseRows(databasePageId: string | undefined) {
  return useQuery<DatabaseRow[]>({
    queryKey: ["database-rows", databasePageId],
    queryFn: () => fetchJSON(`/api/databases/${databasePageId}/rows`),
    enabled: !!databasePageId,
  });
}

export function useCreateDatabaseRow(databasePageId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { properties: Record<string, unknown>; title?: string }) =>
      fetchJSON<DatabaseRow>(`/api/databases/${databasePageId}/rows`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["database-rows", databasePageId] });
    },
  });
}

export function useUpdateDatabaseRow(databasePageId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { rowId: string; properties: Record<string, unknown> }) => {
      const { rowId, ...body } = data;
      return fetchJSON<DatabaseRow>(
        `/api/databases/${databasePageId}/rows/${rowId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["database-rows", databasePageId] });
    },
  });
}

export function useDeleteDatabaseRow(databasePageId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (rowId: string) =>
      fetchJSON(`/api/databases/${databasePageId}/rows/${rowId}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["database-rows", databasePageId] });
    },
  });
}

export function useUpdateDatabaseConfig(databasePageId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { properties?: unknown[]; views?: unknown[] }) =>
      fetchJSON(`/api/databases/${databasePageId}/config`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["page", databasePageId] });
      qc.invalidateQueries({ queryKey: ["database-rows", databasePageId] });
    },
  });
}
