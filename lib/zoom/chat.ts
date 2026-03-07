const ZOOM_API_BASE = "https://api.zoom.us/v2";

export interface ZoomChannel {
  id: string;
  name: string;
  type: number; // 1=1:1, 2=private, 3=public, 4=new chat
  jid: string;
}

export interface ZoomChannelsResponse {
  channels: ZoomChannel[];
  next_page_token?: string;
  page_size: number;
  total_records: number;
}

export interface ZoomMessage {
  id: string;
  message: string;
  sender: string;
  sender_display_name?: string;
  date_time: string;
  timestamp: number;
}

export interface ZoomMessagesResponse {
  messages: ZoomMessage[];
  next_page_token?: string;
  page_size: number;
  date: string;
}

/**
 * Fetch the authenticated user's Team Chat channels.
 */
export async function fetchZoomChannels(
  accessToken: string,
  nextPageToken?: string
): Promise<ZoomChannelsResponse> {
  const params = new URLSearchParams({ page_size: "50" });
  if (nextPageToken) params.set("next_page_token", nextPageToken);

  const response = await fetch(
    `${ZOOM_API_BASE}/chat/users/me/channels?${params.toString()}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Zoom channels fetch failed: ${error}`);
  }

  return response.json();
}

/**
 * Fetch messages from a specific channel.
 */
export async function fetchZoomChannelMessages(
  accessToken: string,
  channelId: string,
  params?: { from?: string; to?: string; nextPageToken?: string; pageSize?: number }
): Promise<ZoomMessagesResponse> {
  const searchParams = new URLSearchParams({
    page_size: String(params?.pageSize || 50),
    to_channel: channelId,
  });
  if (params?.from) searchParams.set("from", params.from);
  if (params?.to) searchParams.set("to", params.to);
  if (params?.nextPageToken) searchParams.set("next_page_token", params.nextPageToken);

  const response = await fetch(
    `${ZOOM_API_BASE}/chat/users/me/messages?${searchParams.toString()}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Zoom channel messages fetch failed: ${error}`);
  }

  return response.json();
}

/**
 * Fetch direct messages with a specific contact.
 */
export async function fetchZoomDirectMessages(
  accessToken: string,
  contactId: string,
  params?: { from?: string; to?: string; nextPageToken?: string; pageSize?: number }
): Promise<ZoomMessagesResponse> {
  const searchParams = new URLSearchParams({
    page_size: String(params?.pageSize || 50),
    to_contact: contactId,
  });
  if (params?.from) searchParams.set("from", params.from);
  if (params?.to) searchParams.set("to", params.to);
  if (params?.nextPageToken) searchParams.set("next_page_token", params.nextPageToken);

  const response = await fetch(
    `${ZOOM_API_BASE}/chat/users/me/messages?${searchParams.toString()}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Zoom direct messages fetch failed: ${error}`);
  }

  return response.json();
}

export interface ZoomContact {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  direct_numbers?: string[];
}

export interface ZoomContactsResponse {
  contacts: ZoomContact[];
  next_page_token?: string;
  page_size: number;
}

/**
 * Fetch the authenticated user's chat contacts (for DM syncing).
 */
export async function fetchZoomContacts(
  accessToken: string,
  nextPageToken?: string
): Promise<ZoomContactsResponse> {
  const params = new URLSearchParams({ page_size: "50", type: "external" });
  if (nextPageToken) params.set("next_page_token", nextPageToken);

  // Also fetch internal contacts
  const [externalRes, internalRes] = await Promise.all([
    fetch(`${ZOOM_API_BASE}/chat/users/me/contacts?${params.toString()}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    }),
    fetch(`${ZOOM_API_BASE}/chat/users/me/contacts?page_size=50&type=internal${nextPageToken ? `&next_page_token=${nextPageToken}` : ""}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    }),
  ]);

  const contacts: ZoomContact[] = [];

  if (externalRes.ok) {
    const data = await externalRes.json();
    contacts.push(...(data.contacts || []));
  }
  if (internalRes.ok) {
    const data = await internalRes.json();
    contacts.push(...(data.contacts || []));
  }

  return { contacts, page_size: 50, next_page_token: undefined };
}

/**
 * Fetch the authenticated Zoom user's profile.
 */
export async function fetchZoomUserProfile(
  accessToken: string
): Promise<{ id: string; email: string; display_name: string }> {
  const response = await fetch(`${ZOOM_API_BASE}/users/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Zoom user profile fetch failed: ${error}`);
  }

  return response.json();
}
