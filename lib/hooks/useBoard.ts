"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Board, BoardWithColumns } from "@/types";

async function fetchJSON<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export function useBoards() {
  return useQuery<Board[]>({
    queryKey: ["boards"],
    queryFn: () => fetchJSON("/api/v1/boards"),
  });
}

export function useBoard(boardId: string) {
  return useQuery<BoardWithColumns>({
    queryKey: ["board", boardId],
    queryFn: () => fetchJSON(`/api/v1/boards/${boardId}`),
    enabled: !!boardId,
  });
}

export function useCreateBoard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { title: string; description?: string; backgroundColor?: string }) =>
      fetchJSON<Board>("/api/v1/boards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["boards"] }),
  });
}

export function useUpdateBoard(boardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { title?: string; description?: string; backgroundColor?: string }) =>
      fetchJSON<Board>(`/api/v1/boards/${boardId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["boards"] });
      qc.invalidateQueries({ queryKey: ["board", boardId] });
    },
  });
}

export function useDeleteBoard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (boardId: string) =>
      fetchJSON(`/api/v1/boards/${boardId}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["boards"] }),
  });
}
