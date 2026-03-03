import { db } from "@/lib/db";
import { calendarEvents, calendarSyncState } from "@/lib/db/schema";
import { eq, and, gte, lte, desc, asc } from "drizzle-orm";

export interface GraphCalendarEvent {
  id: string;
  subject: string | null;
  bodyPreview: string | null;
  body?: { contentType: string; content: string };
  start: { dateTime: string; timeZone: string };
  end: { dateTime: string; timeZone: string };
  isAllDay: boolean;
  location?: { displayName?: string };
  organizer?: {
    emailAddress?: { address?: string; name?: string };
  };
  attendees?: Array<{
    emailAddress?: { address?: string; name?: string };
    status?: { response?: string };
    type?: string;
  }>;
  webLink?: string;
  isCancelled?: boolean;
  showAs?: string;
  importance?: string;
  isRecurring?: boolean | null;
  seriesMasterId?: string | null;
  type?: string;
}

/**
 * Fetch calendar events from Microsoft Graph API for a given time range.
 */
export async function fetchGraphCalendarEvents(
  mailbox: string,
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

  const filter = `start/dateTime ge '${startISO}' and end/dateTime le '${endISO}'`;
  const url = `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(mailbox)}/calendarView?startDateTime=${startISO}&endDateTime=${endISO}&$select=${select}&$orderby=start/dateTime asc&$top=250&$filter=${encodeURIComponent(filter)}`;

  const allEvents: GraphCalendarEvent[] = [];
  let nextLink: string | null = url;

  while (nextLink) {
    const res: Response = await fetch(nextLink, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Prefer: 'outlook.timezone="UTC"',
      },
    });

    if (!res.ok) {
      const errorBody = await res.text().catch(() => "");
      console.warn(
        `[Graph Calendar] Failed to fetch events: ${res.status}`,
        errorBody
      );
      break;
    }

    const data: { value?: GraphCalendarEvent[]; "@odata.nextLink"?: string } =
      await res.json();
    const events: GraphCalendarEvent[] = data.value || [];
    allEvents.push(...events);

    nextLink = data["@odata.nextLink"] || null;
  }

  return allEvents;
}

/**
 * Convert a Graph API calendar event into the shape we store in DB.
 */
function mapGraphEvent(
  event: GraphCalendarEvent,
  tenantId: string,
  credentialId: string | null
) {
  const isRecurring = event.type === "occurrence" || event.type === "exception" || !!event.seriesMasterId;

  return {
    tenantId,
    credentialId,
    graphEventId: event.id,
    subject: event.subject || null,
    bodyPreview: event.bodyPreview || null,
    bodyHtml:
      event.body?.contentType === "html" ? event.body.content || null : null,
    startDateTime: new Date(event.start.dateTime + (event.start.dateTime.endsWith("Z") ? "" : "Z")),
    endDateTime: new Date(event.end.dateTime + (event.end.dateTime.endsWith("Z") ? "" : "Z")),
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
 * Sync calendar events from Graph API into the database.
 * Uses upsert (insert on conflict update) for deduplication.
 */
export async function syncCalendarEvents(
  tenantId: string,
  credentialId: string,
  mailbox: string,
  accessToken: string,
  startDate: Date,
  endDate: Date
): Promise<{ synced: number; errors: number }> {
  const events = await fetchGraphCalendarEvents(
    mailbox,
    accessToken,
    startDate,
    endDate
  );

  let synced = 0;
  let errors = 0;

  for (const event of events) {
    try {
      const mapped = mapGraphEvent(event, tenantId, credentialId);
      await db
        .insert(calendarEvents)
        .values(mapped)
        .onConflictDoUpdate({
          target: [calendarEvents.tenantId, calendarEvents.graphEventId],
          set: {
            subject: mapped.subject,
            bodyPreview: mapped.bodyPreview,
            bodyHtml: mapped.bodyHtml,
            startDateTime: mapped.startDateTime,
            endDateTime: mapped.endDateTime,
            isAllDay: mapped.isAllDay,
            location: mapped.location,
            organizerEmail: mapped.organizerEmail,
            organizerName: mapped.organizerName,
            attendees: mapped.attendees,
            webLink: mapped.webLink,
            isCancelled: mapped.isCancelled,
            showAs: mapped.showAs,
            importance: mapped.importance,
            isRecurring: mapped.isRecurring,
            seriesMasterId: mapped.seriesMasterId,
            rawPayload: mapped.rawPayload,
            lastSyncedAt: mapped.lastSyncedAt,
            updatedAt: mapped.updatedAt,
          },
        });
      synced++;
    } catch (err) {
      console.warn(`[Calendar] Error upserting event ${event.id}:`, err);
      errors++;
    }
  }

  // Update sync state
  await db
    .insert(calendarSyncState)
    .values({
      tenantId,
      credentialId,
      mailbox,
      lastSyncAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [
        calendarSyncState.tenantId,
        calendarSyncState.credentialId,
        calendarSyncState.mailbox,
      ],
      set: {
        lastSyncAt: new Date(),
        updatedAt: new Date(),
      },
    });

  return { synced, errors };
}

/**
 * Get upcoming calendar events for a tenant, starting from now.
 */
export async function getUpcomingEvents(
  tenantId: string,
  limit = 10
) {
  const now = new Date();
  return db
    .select()
    .from(calendarEvents)
    .where(
      and(
        eq(calendarEvents.tenantId, tenantId),
        gte(calendarEvents.startDateTime, now),
        eq(calendarEvents.isCancelled, false)
      )
    )
    .orderBy(asc(calendarEvents.startDateTime))
    .limit(limit);
}

/**
 * Get calendar events within a date range for a tenant.
 */
export async function getCalendarEventsInRange(
  tenantId: string,
  start: Date,
  end: Date
) {
  return db
    .select()
    .from(calendarEvents)
    .where(
      and(
        eq(calendarEvents.tenantId, tenantId),
        gte(calendarEvents.startDateTime, start),
        lte(calendarEvents.endDateTime, end)
      )
    )
    .orderBy(asc(calendarEvents.startDateTime));
}

/**
 * Get the sync state for a tenant.
 */
export async function getSyncState(tenantId: string) {
  return db
    .select()
    .from(calendarSyncState)
    .where(
      and(
        eq(calendarSyncState.tenantId, tenantId),
        eq(calendarSyncState.active, true)
      )
    )
    .orderBy(desc(calendarSyncState.lastSyncAt));
}
