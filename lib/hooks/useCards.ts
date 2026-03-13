"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Card, CardTag, ChecklistItem } from "@/types";

async function fetchJSON<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export function useCreateCard(boardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      columnId,
      ...data
    }: {
      columnId: string;
      title: string;
      description?: string;
      priority?: string;
    }) =>
      fetchJSON<Card>(`/api/v1/columns/${columnId}/cards`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["board", boardId] }),
  });
}

export function useUpdateCard(boardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...data
    }: {
      id: string;
      title?: string;
      description?: string | null;
      priority?: string;
      dueDate?: string | null;
      colorLabel?: string | null;
      archived?: boolean;
      checklist?: ChecklistItem[] | null;
      snoozedUntil?: string | null;
      snoozeReturnColumnId?: string | null;
    }) =>
      fetchJSON<Card>(`/api/v1/cards/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["board", boardId] }),
  });
}

export function useDeleteCard(boardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (cardId: string) =>
      fetchJSON(`/api/v1/cards/${cardId}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["board", boardId] }),
  });
}

export function useDeleteCards(boardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (cardIds: string[]) =>
      Promise.all(
        cardIds.map((id) => fetchJSON(`/api/v1/cards/${id}`, { method: "DELETE" }))
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["board", boardId] }),
  });
}

export function useMoveCard(boardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      cardId,
      targetColumnId,
      position,
    }: {
      cardId: string;
      targetColumnId: string;
      position: number;
    }) =>
      fetchJSON(`/api/v1/cards/${cardId}/move`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetColumnId, position }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["board", boardId] }),
  });
}

export function useReorderCards(boardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ columnId, cardIds }: { columnId: string; cardIds: string[] }) =>
      fetchJSON(`/api/v1/columns/${columnId}/cards/reorder`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardIds }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["board", boardId] }),
  });
}

export function useAddTag(boardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      cardId,
      label,
      color,
    }: {
      cardId: string;
      label: string;
      color: string;
    }) =>
      fetchJSON<CardTag>(`/api/v1/cards/${cardId}/tags`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label, color }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["board", boardId] }),
  });
}

export function useDeleteTag(boardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (tagId: string) =>
      fetchJSON(`/api/v1/tags/${tagId}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["board", boardId] }),
  });
}

// Poll snooze wake-up endpoint to move snoozed cards back when their timer expires
export function useSnoozeWakeUp(boardId: string, hasSnoozedCards: boolean) {
  const qc = useQueryClient();
  return useQuery({
    queryKey: ["snooze-wake", boardId],
    queryFn: async () => {
      const res = await fetchJSON<{ wokenUp: number }>(
        `/api/v1/boards/${boardId}/snooze-wake`,
        { method: "POST" },
      );
      if (res.wokenUp > 0) {
        qc.invalidateQueries({ queryKey: ["board", boardId] });
      }
      return res;
    },
    // Only poll when there are snoozed cards
    enabled: hasSnoozedCards,
    refetchInterval: 30_000, // Poll every 30 seconds
    refetchIntervalInBackground: true,
  });
}
