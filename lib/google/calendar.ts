import { db } from "@/lib/db";
import { calendarEvents } from "@/lib/db/schema";
import {
  encryptFields,
  CALENDAR_EVENT_ENCRYPTED_FIELDS,
} from "@/lib/db/encryption-helpers";
import { updateGoogleLastSync } from "./oauth";

const GOOGLE_CALENDAR_API = "https://www.googleapis.com/calendar/v3";

interface GoogleCalendarEvent {
  id: string;
  summary?: string;
  description?: string;
  htmlLink?: string;
  start?: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end?: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  location?: string;
  organizer?: {
    email?: string;
    displayName?: string;
    self?: boolean;
  };
  attendees?: Array<{
    email?: string;
    displayName?: string;
    responseStatus?: string;
    optional?: boolean;
  }>;
  status?: string;
  recurringEventId?: string;
  hangoutLink?: string;
  conferenceData?: {
    entryPoints?: Array<{
      entryPointType?: string;
      uri?: string;
    }>;
  };
}

/**
 * Fetch calendar events from the user's primary Google Calendar.
 */
export async function fetchGoogleCalendarEvents(
  accessToken: string,
  startDate: Date,
  endDate: Date
): Promise<GoogleCalendarEvent[]> {
  const allEvents: GoogleCalendarEvent[] = [];
  let pageToken: string | undefined;

  do {
    const params = new URLSearchParams({
      timeMin: startDate.toISOString(),
      timeMax: endDate.toISOString(),
      singleEvents: "true",
      orderBy: "startTime",
      maxResults: "250",
    });
    if (pageToken) {
      params.set("pageToken", pageToken);
    }

    const url = `${GOOGLE_CALENDAR_API}/calendars/primary/events?${params.toString()}`;

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) {
      const errorBody = await res.text().catch(() => "");
      console.warn(
        `[Google Calendar] Failed to fetch events: ${res.status}`,
        errorBody
      );
      break;
    }

    const data: {
      items?: GoogleCalendarEvent[];
      nextPageToken?: string;
    } = await res.json();

    allEvents.push(...(data.items || []));
    pageToken = data.nextPageToken;
  } while (pageToken);

  return allEvents;
}

/**
 * Map a Google Calendar event to the shared calendar_events database shape.
 */
function mapGoogleEvent(event: GoogleCalendarEvent, tenantId: string) {
  const isAllDay = !event.start?.dateTime;
  const startStr = event.start?.dateTime || event.start?.date || "";
  const endStr = event.end?.dateTime || event.end?.date || "";

  // For all-day events, date is YYYY-MM-DD — treat as midnight UTC
  const startDateTime = isAllDay
    ? new Date(startStr + "T00:00:00Z")
    : new Date(startStr);
  const endDateTime = isAllDay
    ? new Date(endStr + "T00:00:00Z")
    : new Date(endStr);

  // Extract meet/conference link
  const meetLink =
    event.hangoutLink ||
    event.conferenceData?.entryPoints?.find(
      (ep) => ep.entryPointType === "video"
    )?.uri ||
    null;

  // Map Google attendee response status to our format
  const mapResponse = (status?: string) => {
    switch (status) {
      case "accepted":
        return "accepted";
      case "declined":
        return "declined";
      case "tentative":
        return "tentativelyAccepted";
      default:
        return "none";
    }
  };

  return {
    tenantId,
    credentialId: null as string | null,
    graphEventId: `gcal_${event.id}`,
    subject: event.summary || null,
    bodyPreview: event.description?.substring(0, 500) || null,
    bodyHtml: null as string | null,
    startDateTime,
    endDateTime,
    isAllDay,
    location: event.location || null,
    organizerEmail: event.organizer?.email || null,
    organizerName: event.organizer?.displayName || null,
    attendees: (event.attendees || []).map((a) => ({
      email: a.email || "",
      name: a.displayName || "",
      response: mapResponse(a.responseStatus),
      type: a.optional ? "optional" : "required",
    })),
    webLink: meetLink || event.htmlLink || null,
    isCancelled: event.status === "cancelled",
    showAs: null as string | null,
    importance: null as string | null,
    isRecurring: !!event.recurringEventId,
    seriesMasterId: event.recurringEventId || null,
    rawPayload: event as unknown as Record<string, unknown>,
    lastSyncedAt: new Date(),
    updatedAt: new Date(),
  };
}

/**
 * Sync Google Calendar events into the database.
 * Uses upsert for deduplication by (tenantId, graphEventId).
 * graphEventId is prefixed with "gcal_" to avoid collisions with Outlook events.
 */
export async function syncGoogleCalendarEvents(
  tenantId: string,
  accountId: string,
  accessToken: string,
  startDate: Date,
  endDate: Date
): Promise<{ synced: number; errors: number }> {
  const events = await fetchGoogleCalendarEvents(
    accessToken,
    startDate,
    endDate
  );

  let synced = 0;
  let errors = 0;

  for (const event of events) {
    try {
      const mapped = mapGoogleEvent(event, tenantId);
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
      console.warn(
        `[Google Calendar] Error upserting event ${event.id}:`,
        err
      );
      errors++;
    }
  }

  // Update the last sync timestamp on the Google token record
  await updateGoogleLastSync(accountId);

  return { synced, errors };
}
