/**
 * Types for Zoom Chat integration
 */

export interface ZoomOauthTokenRow {
  id: string;
  tenant_id: string;
  zoom_account_id: string | null;
  access_token: string;
  refresh_token: string;
  token_expiry: Date;
  active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface ZoomChatMessageRow {
  id: string;
  tenant_id: string;
  zoom_user_id: string;
  message_id: string;
  channel_id: string | null;
  channel_type: "dm" | "channel";
  sender_id: string;
  sender_name: string | null;
  message_content: string | null;
  message_timestamp: Date;
  is_edited: boolean;
  is_deleted: boolean;
  raw_payload: object | null;
  created_at: Date;
  updated_at: Date;
}

export interface ZoomChatMessageInsert {
  tenant_id: string;
  zoom_user_id: string;
  message_id: string;
  channel_id?: string | null;
  channel_type: "dm" | "channel";
  sender_id: string;
  sender_name?: string | null;
  message_content?: string | null;
  message_timestamp: Date;
  raw_payload?: object | null;
}

/**
 * Zoom webhook event payload for chat_message.sent
 */
export interface ZoomChatWebhookPayload {
  event: string;
  event_ts: number;
  payload: {
    account_id: string;
    object: {
      id: string;
      type: string;
      date_time: string;
      session_id?: string;
      contact_id?: string;
      contact_email?: string;
      channel_id?: string;
      channel_name?: string;
      message: string;
      timestamp: number;
      operator: string;
      operator_id: string;
      operator_member_id?: string;
    };
  };
}

/**
 * Zoom webhook event payload for chat_message.updated
 */
export interface ZoomChatMessageUpdatedPayload {
  event: string;
  event_ts: number;
  payload: {
    account_id: string;
    object: {
      id: string;
      type: string;
      date_time: string;
      session_id?: string;
      contact_id?: string;
      contact_email?: string;
      channel_id?: string;
      channel_name?: string;
      message: string;
      timestamp: number;
      operator: string;
      operator_id: string;
    };
  };
}

/**
 * Zoom webhook event payload for chat_message.deleted
 */
export interface ZoomChatMessageDeletedPayload {
  event: string;
  event_ts: number;
  payload: {
    account_id: string;
    object: {
      id: string;
      type: string;
      date_time: string;
      session_id?: string;
      channel_id?: string;
      operator: string;
      operator_id: string;
    };
  };
}

/**
 * Zoom OAuth token response
 */
export interface ZoomTokenResponse {
  access_token: string;
  token_type: string;
  refresh_token: string;
  expires_in: number;
  scope: string;
}

/**
 * Zoom user-managed OAuth token row (multi-account)
 */
export interface ZoomUserOauthTokenRow {
  id: string;
  tenant_id: string;
  zoom_email: string;
  zoom_user_id: string | null;
  access_token: string;
  refresh_token: string;
  token_expiry: string;
  active: boolean;
  last_sync_at: string | null;
  sync_cursor: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Zoom Team Chat channel
 */
export interface ZoomChannel {
  id: string;
  name: string;
  type: number;
  jid: string;
}

/**
 * Zoom Team Chat messages page response
 */
export interface ZoomMessagePage {
  messages: {
    id: string;
    message: string;
    sender: string;
    sender_display_name?: string;
    date_time: string;
    timestamp: number;
  }[];
  next_page_token?: string;
  page_size: number;
  date: string;
}
