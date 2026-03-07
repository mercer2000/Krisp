import { db } from "@/lib/db";
import { calendarEvents } from "@/lib/db/schema";
import {
  encryptFields,
  CALENDAR_EVENT_ENCRYPTED_FIELDS,
} from "@/lib/db/encryption-helpers";
import type { GraphCalendarEvent } from "@/lib/graph/calendar";
import { updateOutlookLastSync } from "./oauth";

const GRAPH_BASE = "https://graph.microsoft.com/v1.0";

/**
 * Fetch calendar events from the authenticated user's calendar using
 * delegated permissions (/me/calendarView).
 */
export async function fetchOutlookCalendarEvents(
  accessToken: string,
  startDate: Date,
  endDate: Date
): Promise<GraphCalendarEvent[]> {
  const select = [
    "id",
    "subject",
    "bodyPreview",
    "body",
    "start",
    "end",
    "isAllDay",
    "location",
    "organizer",
    "attendees",
    "webLink",
    "isCancelled",
    "showAs",
    "importance",
    "type",
    "seriesMasterId",
  ].join(",");

  const startISO = startDate.toISOString();
  const endISO = endDate.toISOString();

  const url = `${GRAPH_BASE}/me/calendarView?startDateTime=${startISO}&endDateTime=${endISO}&$select=${select}&$orderby=start/dateTime asc&$top=250`;

  const allEvents: GraphCalendarEvent[] = [];
  let nextLink: string | null = url;

  while (nextLink) {
    const res = await fetch(nextLink, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Prefer: 'outlook.timezone="UTC"',
      },
    });

    if (!res.ok) {
      const errorBody = await res.text().catch(() => "");
      console.warn(
        `[Outlook Calendar] Failed to fetch events: ${res.status}`,
        errorBody
      );
      break;
    }

    const data: { value?: GraphCalendarEvent[]; "@odata.nextLink"?: string } =
      await res.json();
    allEvents.push(...(data.value || []));
    nextLink = data["@odata.nextLink"] || null;
  }

  return allEvents;
}

/**
 * Map a Graph calendar event to the database shape.
 * credentialId is null for Outlook delegated-auth syncs.
 */
function mapOutlookEvent(event: GraphCalendarEvent, tenantId: string) {
  const isRecurring =
    event.type === "occurrence" ||
    event.type === "exception" ||
    !!event.seriesMasterId;

  return {
    tenantId,
    credentialId: null as string | null,
    graphEventId: event.id,
    subject: event.subject || null,
    bodyPreview: event.bodyPreview || null,
    bodyHtml:
      event.body?.contentType === "html" ? event.body.content || null : null,
    startDateTime: new Date(
      event.start.dateTime +
        (event.start.dateTime.endsWith("Z") ? "" : "Z")
    ),
    endDateTime: new Date(
      event.end.dateTime +
        (event.end.dateTime.endsWith("Z") ? "" : "Z")
    ),
    isAllDay: event.isAllDay ?? false,
    location: event.location?.displayName || null,
    organizerEmail: event.organizer?.emailAddress?.address || null,
    organizerName: event.organizer?.emailAddress?.name || null,
    attendees: (event.attendees || []).map((a) => ({
      email: a.emailAddress?.address || "",
      name: a.emailAddress?.name || "",
      response: a.status?.response || "none",
      type: a.type || "required",
    })),
    webLink: event.webLink || null,
    isCancelled: event.isCancelled ?? false,
    showAs: event.showAs || null,
    importance: event.importance || null,
    isRecurring,
    seriesMasterId: event.seriesMasterId || null,
    rawPayload: event as unknown as Record<string, unknown>,
    lastSyncedAt: new Date(),
    updatedAt: new Date(),
  };
}

/**
 * Sync Outlook calendar events into the database using delegated auth.
 * Uses upsert for deduplication by (tenantId, graphEventId).
 * Stores events in the shared calendar_events table with credentialId = null.
 */
export async function syncOutlookCalendarEvents(
  tenantId: string,
  accountId: string,
  accessToken: string,
  startDate: Date,
  endDate: Date
): Promise<{ synced: number; errors: number }> {
  const events = await fetchOutlookCalendarEvents(
    accessToken,
    startDate,
    endDate
  );

  let synced = 0;
  let errors = 0;

  for (const event of events) {
    try {
      const mapped = mapOutlookEvent(event, tenantId);
      const encrypted = encryptFields(mapped, CALENDAR_EVENT_ENCRYPTED_FIELDS);
      await db
        .insert(calendarEvents)
        .values(encrypted)
        .onConflictDoUpdate({
          target: [calendarEvents.tenantId, calendarEvents.graphEventId],
          set: {
            subject: encrypted.subject,
            bodyPreview: encrypted.bodyPreview,
            bodyHtml: encrypted.bodyHtml,
            startDateTime: encrypted.startDateTime,
            endDateTime: encrypted.endDateTime,
            isAllDay: encrypted.isAllDay,
            location: encrypted.location,
            organizerEmail: encrypted.organizerEmail,
            organizerName: encrypted.organizerName,
            attendees: encrypted.attendees,
            webLink: encrypted.webLink,
            isCancelled: encrypted.isCancelled,
            showAs: encrypted.showAs,
            importance: encrypted.importance,
            isRecurring: encrypted.isRecurring,
            seriesMasterId: encrypted.seriesMasterId,
            rawPayload: encrypted.rawPayload,
            lastSyncedAt: encrypted.lastSyncedAt,
            updatedAt: encrypted.updatedAt,
          },
        });
      synced++;
    } catch (err) {
      console.warn(`[Outlook Calendar] Error upserting event ${event.id}:`, err);
      errors++;
    }
  }

  // Update the last sync timestamp on the outlook token record
  await updateOutlookLastSync(accountId);

  return { synced, errors };
}
