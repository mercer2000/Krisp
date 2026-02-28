"use client";

import { useQuery } from "@tanstack/react-query";
import type { Card } from "@/types";

export function useSearchCards(boardId: string, query: string) {
  return useQuery<Card[]>({
    queryKey: ["search", boardId, query],
    queryFn: async () => {
      const res = await fetch(
        `/api/v1/boards/${boardId}/cards/search?q=${encodeURIComponent(query)}`
      );
      if (!res.ok) throw new Error("Search failed");
      return res.json();
    },
    enabled: !!boardId && query.length >= 2,
    staleTime: 10 * 1000,
  });
}
