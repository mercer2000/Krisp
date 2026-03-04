"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Block } from "@/types";

async function fetchJSON<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export function useCreateBlock(pageId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      type: string;
      content: Record<string, unknown>;
      parent_block_id?: string;
      sort_order: number;
    }) =>
      fetchJSON<Block>(`/api/pages/${pageId}/blocks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["page", pageId] }),
  });
}

export function useUpdateBlock(pageId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      blockId: string;
      content?: Record<string, unknown>;
      type?: string;
      sort_order?: number;
      parent_block_id?: string | null;
      _skipInvalidate?: boolean;
    }) => {
      const { blockId, _skipInvalidate, ...body } = data;
      return fetchJSON<Block>(`/api/blocks/${blockId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    },
    onSuccess: (_result, vars) => {
      // Skip query invalidation for content-only edits to avoid
      // re-rendering contentEditable and resetting cursor position
      if (!vars._skipInvalidate) {
        qc.invalidateQueries({ queryKey: ["page", pageId] });
      }
    },
  });
}

export function useDeleteBlock(pageId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (blockId: string) =>
      fetchJSON(`/api/blocks/${blockId}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["page", pageId] }),
  });
}

export function useReorderBlocks(pageId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      blocks: { id: string; sort_order: number; parent_block_id?: string | null }[];
    }) =>
      fetchJSON(`/api/pages/${pageId}/blocks/reorder`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["page", pageId] }),
  });
}
