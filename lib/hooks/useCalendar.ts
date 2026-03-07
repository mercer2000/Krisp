"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { CalendarEvent } from "@/types";

async function fetchJSON<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export function useUpcomingEvents(limit = 5) {
  return useQuery<{ events: CalendarEvent[] }>({
    queryKey: ["calendar", "upcoming", limit],
    queryFn: () => fetchJSON(`/api/calendar/upcoming?limit=${limit}`),
    refetchInterval: 5 * 60 * 1000, // poll every 5 minutes
  });
}

export function useCalendarEventsInRange(start: string, end: string) {
  return useQuery<{ events: CalendarEvent[] }>({
    queryKey: ["calendar", "range", start, end],
    queryFn: () =>
      fetchJSON(
        `/api/calendar/upcoming?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`
      ),
    enabled: !!start && !!end,
  });
}

export function useCalendarSync() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      credentialId: string;
      mailbox: string;
      daysBack?: number;
      daysForward?: number;
    }) =>
      fetchJSON<{ message: string; synced: number; errors: number }>(
        "/api/calendar/sync",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        }
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["calendar"] });
    },
  });
}

export function useSyncState() {
  return useQuery<{
    syncStates: Array<{
      id: string;
      tenantId: string;
      credentialId: string;
      mailbox: string;
      lastSyncAt: string | null;
      active: boolean;
    }>;
    credentials: Array<{
      id: string;
      label: string;
      azureTenantId: string;
      clientId: string;
    }>;
  }>({
    queryKey: ["calendar", "syncState"],
    queryFn: () => fetchJSON("/api/calendar/sync"),
  });
}

export interface OutlookAccount {
  id: string;
  outlookEmail: string;
  lastSyncAt?: string | null;
}

export function useOutlookCalendarStatus() {
  return useQuery<{
    connected: boolean;
    accounts: OutlookAccount[];
  }>({
    queryKey: ["calendar", "outlookStatus"],
    queryFn: () => fetchJSON("/api/outlook/calendar"),
  });
}

export interface GoogleCalendarAccount {
  id: string;
  googleEmail: string;
  lastSyncAt?: string | null;
}

export function useGoogleCalendarStatus() {
  return useQuery<{
    connected: boolean;
    accounts: GoogleCalendarAccount[];
  }>({
    queryKey: ["calendar", "googleStatus"],
    queryFn: () => fetchJSON("/api/google/calendar"),
  });
}

export function useGoogleCalendarSync() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { accountId?: string; daysBack?: number; daysForward?: number }) =>
      fetchJSON<{ message: string; synced: number; errors: number }>(
        "/api/google/calendar",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        }
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["calendar"] });
    },
  });
}

export function useOutlookCalendarSync() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { accountId?: string; daysBack?: number; daysForward?: number }) =>
      fetchJSON<{ message: string; synced: number; errors: number }>(
        "/api/outlook/calendar",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        }
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["calendar"] });
    },
  });
}
