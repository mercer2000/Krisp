/**
 * Types for Microsoft 365 Exchange email webhook payloads
 */

export interface EmailAttachmentMetadata {
  name: string;
  contentType: string;
  size: number;
}

export interface EmailWebhookPayload {
  messageId: string;
  from: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject?: string;
  bodyPlainText?: string;
  bodyHtml?: string;
  receivedDateTime: string;
  attachments?: EmailAttachmentMetadata[];
  webLink?: string;
}

// Database row type
export interface EmailRow {
  id: number;
  tenant_id: string;
  message_id: string;
  sender: string;
  recipients: string[];
  cc: string[];
  bcc: string[];
  subject: string | null;
  body_plain_text: string | null;
  body_html: string | null;
  received_at: Date;
  attachments_metadata: EmailAttachmentMetadata[];
  web_link: string | null;
  raw_payload: EmailWebhookPayload;
  created_at: Date;
  updated_at: Date;
}

// Insert data type (excludes auto-generated fields)
export interface EmailInsert {
  tenant_id: string;
  message_id: string;
  sender: string;
  recipients: string[];
  cc?: string[];
  bcc?: string[];
  subject?: string | null;
  body_plain_text?: string | null;
  body_html?: string | null;
  received_at: Date;
  attachments_metadata?: EmailAttachmentMetadata[];
  raw_payload: EmailWebhookPayload;
}

// Smart label attached to an email
export interface EmailLabelChip {
  id: string;
  name: string;
  color: string;
  confidence: number | null;
}

// Inbox list item (lightweight, excludes body content)
export interface EmailListItem {
  id: number | string;
  sender: string;
  subject: string | null;
  received_at: string;
  recipients: string[];
  has_attachments: boolean;
  preview: string | null;
  web_link: string | null;
  outlook_account_id: string | null;
  account_id: string | null;
  provider: "outlook" | "gmail" | "zoom";
  labels?: EmailLabelChip[];
  is_newsletter?: boolean;
  is_spam?: boolean;
  is_vip?: boolean;
  unsubscribe_link?: string | null;
}

// Inbox list response
export interface EmailListResponse {
  data: EmailListItem[];
  total: number;
  page: number;
  limit: number;
}

// Semantic search result item
export interface EmailSearchItem extends EmailListItem {
  similarity: number;
}

// Semantic search response
export interface EmailSearchResponse {
  query: string;
  data: EmailSearchItem[];
  embedding_status: {
    total: number;
    embedded: number;
    pending: number;
  };
}

// Full email for detail view (excludes raw_payload)
export interface EmailDetail {
  id: number;
  tenant_id: string;
  message_id: string;
  sender: string;
  recipients: string[];
  cc: string[];
  bcc: string[];
  subject: string | null;
  body_plain_text: string | null;
  body_html: string | null;
  received_at: string;
  attachments_metadata: EmailAttachmentMetadata[];
  web_link: string | null;
  created_at: string;
  updated_at: string;
}
