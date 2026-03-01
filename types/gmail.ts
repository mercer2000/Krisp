/**
 * Types for Gmail email ingestion via Google Pub/Sub and Apps Script
 */

export interface GmailAttachmentMetadata {
  name: string;
  mimeType: string;
  size: number;
  attachmentId: string;
}

/**
 * Pub/Sub push message envelope.
 * The `data` field is base64-encoded and contains `{ emailAddress, historyId }`.
 */
export interface PubSubPushMessage {
  message: {
    data: string;
    messageId: string;
    publishTime: string;
  };
  subscription: string;
}

export interface PubSubDecodedData {
  emailAddress: string;
  historyId: number;
}

/**
 * Apps Script webhook payload — pre-parsed email data sent directly
 * from the tenant's Apps Script project.
 */
export interface GmailAppsScriptPayload {
  messageId: string;
  sender: string;
  recipients: string;
  subject?: string;
  bodyPlain?: string;
  bodyHtml?: string;
  receivedAt: string;
}

/**
 * Database row type for gmail_emails table.
 */
export interface GmailEmailRow {
  id: string;
  tenant_id: string;
  gmail_message_id: string;
  thread_id: string | null;
  sender: string;
  recipients: object;
  subject: string | null;
  body_plain: string | null;
  body_html: string | null;
  received_at: Date;
  attachments: object;
  labels: object;
  raw_payload: object | null;
  ingested_at: Date;
  updated_at: Date;
}

export interface GmailEmailInsert {
  tenant_id: string;
  gmail_message_id: string;
  thread_id?: string | null;
  sender: string;
  recipients: object;
  subject?: string | null;
  body_plain?: string | null;
  body_html?: string | null;
  received_at: Date;
  attachments?: object;
  labels?: object;
  raw_payload?: object | null;
}
