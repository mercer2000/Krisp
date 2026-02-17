/**
 * Types for Krisp webhook payloads
 */

export interface KeyPointContent {
  id: string;
  description: string;
}

export interface TranscriptContent {
  speaker: string;
  speakerIndex: number;
  text: string;
}

export interface Speaker {
  index: number;
  first_name?: string;
  last_name?: string;
}

export interface Meeting {
  id: string;
  title: string;
  url: string;
  start_date: string;
  end_date: string;
  duration: number;
  speakers: Speaker[];
  participants: string[];
  calendar_event_id: string | null;
}

export type WebhookEventType = "key_points_generated" | "transcript_created";

export interface KeyPointsGeneratedData {
  meeting: Meeting;
  content: KeyPointContent[];
  raw_meeting: string;
  raw_content: string;
}

export interface TranscriptCreatedData {
  meeting: Meeting;
  content: TranscriptContent[];
  raw_meeting: string;
  raw_content: string;
}

export interface KeyPointsGeneratedWebhook {
  id: string;
  event: "key_points_generated";
  data: KeyPointsGeneratedData;
}

export interface TranscriptCreatedWebhook {
  id: string;
  event: "transcript_created";
  data: TranscriptCreatedData;
}

export type KrispWebhook = KeyPointsGeneratedWebhook | TranscriptCreatedWebhook;

// Database row type
export interface WebhookKeyPointsRow {
  id: number;
  webhook_id: string;
  event_type: string;
  meeting_id: string;
  meeting_title: string | null;
  meeting_url: string | null;
  meeting_start_date: Date | null;
  meeting_end_date: Date | null;
  meeting_duration: number | null;
  speakers: Speaker[];
  participants: string[];
  calendar_event_id: string | null;
  content: KeyPointContent[] | TranscriptContent[];
  raw_meeting: string | null;
  raw_content: string | null;
  full_payload: KrispWebhook;
  received_at: Date;
  created_at: Date;
  updated_at: Date;
}

// Insert data type (excludes auto-generated fields)
export interface WebhookKeyPointsInsert {
  webhook_id: string;
  event_type: string;
  meeting_id: string;
  meeting_title?: string | null;
  meeting_url?: string | null;
  meeting_start_date?: Date | null;
  meeting_end_date?: Date | null;
  meeting_duration?: number | null;
  speakers?: Speaker[];
  participants?: string[];
  calendar_event_id?: string | null;
  content: KeyPointContent[] | TranscriptContent[];
  raw_meeting?: string | null;
  raw_content?: string | null;
  full_payload: KrispWebhook;
}
