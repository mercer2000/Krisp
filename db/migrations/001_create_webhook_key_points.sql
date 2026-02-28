-- Migration: Create webhook_key_points table
-- Description: Stores key points generated webhooks from Krisp meetings

CREATE TABLE IF NOT EXISTS webhook_key_points (
    id SERIAL PRIMARY KEY,

    -- Webhook metadata
    webhook_id VARCHAR(255) NOT NULL UNIQUE,
    event_type VARCHAR(100) NOT NULL,

    -- Meeting information
    meeting_id VARCHAR(255) NOT NULL,
    meeting_title TEXT,
    meeting_url TEXT,
    meeting_start_date TIMESTAMP WITH TIME ZONE,
    meeting_end_date TIMESTAMP WITH TIME ZONE,
    meeting_duration INTEGER, -- in seconds

    -- Participants data (stored as JSONB for flexibility)
    speakers JSONB DEFAULT '[]'::jsonb,
    participants JSONB DEFAULT '[]'::jsonb,
    calendar_event_id VARCHAR(255),

    -- Content data
    content JSONB NOT NULL DEFAULT '[]'::jsonb,
    raw_meeting TEXT,
    raw_content TEXT,

    -- Full payload for reference
    full_payload JSONB NOT NULL,

    -- Timestamps
    received_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_webhook_key_points_webhook_id ON webhook_key_points(webhook_id);
CREATE INDEX IF NOT EXISTS idx_webhook_key_points_meeting_id ON webhook_key_points(meeting_id);
CREATE INDEX IF NOT EXISTS idx_webhook_key_points_event_type ON webhook_key_points(event_type);
CREATE INDEX IF NOT EXISTS idx_webhook_key_points_meeting_start_date ON webhook_key_points(meeting_start_date);
CREATE INDEX IF NOT EXISTS idx_webhook_key_points_received_at ON webhook_key_points(received_at);

-- Add comment to table
COMMENT ON TABLE webhook_key_points IS 'Stores key points generated from Krisp meeting webhooks';
