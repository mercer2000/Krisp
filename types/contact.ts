export interface ContactListItem {
  id: string;
  email: string;
  display_name: string | null;
  email_count: number;
  last_email_at: string | null;
  first_seen_at: string;
}

export interface ContactListResponse {
  data: ContactListItem[];
  total: number;
  page: number;
  limit: number;
}

export interface ContactDetail extends ContactListItem {
  recent_emails: ContactRecentEmail[];
}

export interface ContactRecentEmail {
  id: number | string;
  subject: string | null;
  received_at: string;
  provider: "outlook" | "gmail";
}

export interface ContactSuggestion {
  email: string;
  display_name: string | null;
}
