"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useCallback, useMemo } from "react";

export interface MeetingFilterState {
  dateFrom: string | null;
  dateTo: string | null;
  durationMin: string | null;
  durationMax: string | null;
  participants: string[];
  hasActionItems: boolean | null;
  actionItemStatus: string | null;
  hasTranscript: boolean | null;
  keyword: string | null;
}

const FILTER_KEYS = [
  "dateFrom",
  "dateTo",
  "durationMin",
  "durationMax",
  "participants",
  "hasActionItems",
  "actionItemStatus",
  "hasTranscript",
  "keyword",
] as const;

export function useMeetingFilters() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const filters: MeetingFilterState = useMemo(() => ({
    dateFrom: searchParams.get("dateFrom"),
    dateTo: searchParams.get("dateTo"),
    durationMin: searchParams.get("durationMin"),
    durationMax: searchParams.get("durationMax"),
    participants: searchParams.get("participants")?.split(",").filter(Boolean) ?? [],
    hasActionItems: searchParams.has("hasActionItems")
      ? searchParams.get("hasActionItems") === "true"
      : null,
    actionItemStatus: searchParams.get("actionItemStatus"),
    hasTranscript: searchParams.has("hasTranscript")
      ? searchParams.get("hasTranscript") === "true"
      : null,
    keyword: searchParams.get("keyword"),
  }), [searchParams]);

  const hasActiveFilters = useMemo(() => {
    return FILTER_KEYS.some((key) => searchParams.has(key));
  }, [searchParams]);

  const activeFilterCount = useMemo(() => {
    return FILTER_KEYS.filter((key) => searchParams.has(key)).length;
  }, [searchParams]);

  const setFilters = useCallback(
    (updates: Partial<MeetingFilterState>) => {
      const params = new URLSearchParams(searchParams.toString());

      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === undefined || value === "") {
          params.delete(key);
        } else if (key === "participants") {
          const arr = value as string[];
          if (arr.length === 0) {
            params.delete(key);
          } else {
            params.set(key, arr.join(","));
          }
        } else if (typeof value === "boolean") {
          params.set(key, String(value));
        } else {
          params.set(key, String(value));
        }
      }

      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [searchParams, router, pathname]
  );

  const removeFilter = useCallback(
    (key: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.delete(key);
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [searchParams, router, pathname]
  );

  const clearAll = useCallback(() => {
    router.push(pathname, { scroll: false });
  }, [router, pathname]);

  const buildQueryString = useCallback(() => {
    const params = new URLSearchParams();
    if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
    if (filters.dateTo) params.set("dateTo", filters.dateTo);
    if (filters.durationMin) params.set("durationMin", filters.durationMin);
    if (filters.durationMax) params.set("durationMax", filters.durationMax);
    if (filters.participants.length > 0) params.set("participants", filters.participants.join(","));
    if (filters.hasActionItems !== null) params.set("hasActionItems", String(filters.hasActionItems));
    if (filters.actionItemStatus) params.set("actionItemStatus", filters.actionItemStatus);
    if (filters.hasTranscript !== null) params.set("hasTranscript", String(filters.hasTranscript));
    if (filters.keyword) params.set("keyword", filters.keyword);
    return params.toString();
  }, [filters]);

  return {
    filters,
    hasActiveFilters,
    activeFilterCount,
    setFilters,
    removeFilter,
    clearAll,
    buildQueryString,
  };
}
