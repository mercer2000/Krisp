"use client";

import { useState, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export interface PrioritySuggestion {
  cardId: string;
  cardTitle: string;
  currentPriority: string;
  suggestedPriority: string;
  suggestedDueDate: string | null;
  reason: string;
}

async function fetchPrioritySuggestions(
  boardId: string,
): Promise<PrioritySuggestion[]> {
  const res = await fetch(`/api/v1/boards/${boardId}/priority-review`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  const data = await res.json();
  return data.suggestions ?? [];
}

async function updateCard(
  cardId: string,
  updates: { priority?: string; dueDate?: string },
): Promise<void> {
  const res = await fetch(`/api/v1/cards/${cardId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });
  if (!res.ok) {
    throw new Error("Failed to update card");
  }
}

export function usePriorityReview(boardId: string) {
  const queryClient = useQueryClient();
  const [suggestions, setSuggestions] = useState<PrioritySuggestion[]>([]);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  const analyze = useMutation({
    mutationFn: () => fetchPrioritySuggestions(boardId),
    onSuccess: (data) => {
      setSuggestions(data);
      setDismissedIds(new Set());
    },
  });

  const accept = useMutation({
    mutationFn: async (suggestion: PrioritySuggestion) => {
      const updates: { priority?: string; dueDate?: string } = {};
      if (suggestion.suggestedPriority !== suggestion.currentPriority) {
        updates.priority = suggestion.suggestedPriority;
      }
      if (suggestion.suggestedDueDate) {
        updates.dueDate = suggestion.suggestedDueDate;
      }
      await updateCard(suggestion.cardId, updates);
    },
    onSuccess: (_, suggestion) => {
      setSuggestions((prev) =>
        prev.filter((s) => s.cardId !== suggestion.cardId),
      );
      queryClient.invalidateQueries({ queryKey: ["board", boardId] });
    },
  });

  const dismiss = useCallback((cardId: string) => {
    setDismissedIds((prev) => new Set(prev).add(cardId));
  }, []);

  const visibleSuggestions = suggestions.filter(
    (s) => !dismissedIds.has(s.cardId),
  );

  return {
    suggestions: visibleSuggestions,
    allSuggestions: suggestions,
    isAnalyzing: analyze.isPending,
    analyzeError: analyze.error,
    isAccepting: accept.isPending,
    analyze: analyze.mutate,
    accept: accept.mutate,
    dismiss,
  };
}
