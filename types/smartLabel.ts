/** A user-defined smart label with a natural-language matching prompt. */
export interface SmartLabel {
  id: string;
  tenant_id: string;
  name: string;
  prompt: string;
  color: string;
  active: boolean;
  auto_draft_enabled: boolean;
  context_window_max: number;
  graph_folder_id: string | null;
  folder_sync_status: "none" | "pending" | "synced" | "failed" | "unlinked";
  outlook_account_id: string | null;
  created_at: string;
  updated_at: string;
}

/** A context entry in a label's memory/context window. */
export interface SmartLabelContextEntry {
  id: string;
  label_id: string;
  email_id: string;
  email_type: string;
  sender: string;
  subject: string | null;
  received_at: string;
  body_excerpt: string | null;
  user_replied: boolean;
  reply_excerpt: string | null;
  created_at: string;
}

/** An AI-generated email reply draft. */
export interface EmailDraft {
  id: string;
  tenant_id: string;
  email_id: string;
  email_type: string;
  label_id: string | null;
  draft_body: string;
  status: "pending_review" | "sent" | "discarded";
  discarded_at: string | null;
  sent_at: string | null;
  created_at: string;
  updated_at: string;
}

/** A label ↔ item association persisted after classification. */
export interface SmartLabelItem {
  id: string;
  label_id: string;
  item_type: "email" | "gmail_email" | "card" | "action_item" | "meeting";
  item_id: string;
  confidence: number | null;
  assigned_by: "ai" | "manual";
  created_at: string;
}

/** Lightweight chip for rendering in lists. */
export interface SmartLabelChip {
  id: string;
  name: string;
  color: string;
  confidence: number | null;
  assigned_by: "ai" | "manual";
}
