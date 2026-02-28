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
