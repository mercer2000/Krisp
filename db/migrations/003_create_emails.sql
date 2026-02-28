-- Migration: Create emails table for Microsoft 365 Exchange email ingestion
-- Supports multi-tenant data isolation via tenant_id (references users.id)

CREATE TABLE IF NOT EXISTS emails (
  id SERIAL PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message_id VARCHAR(512) NOT NULL,
  sender VARCHAR(512) NOT NULL,
  recipients JSONB NOT NULL DEFAULT '[]',
  cc JSONB NOT NULL DEFAULT '[]',
  bcc JSONB NOT NULL DEFAULT '[]',
  subject TEXT,
  body_plain_text TEXT,
  body_html TEXT,
  received_at TIMESTAMPTZ NOT NULL,
  attachments_metadata JSONB NOT NULL DEFAULT '[]',
  raw_payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Unique constraint for deduplication: tenant + message ID
  CONSTRAINT uq_emails_tenant_message UNIQUE (tenant_id, message_id)
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_emails_tenant_id ON emails (tenant_id);
CREATE INDEX IF NOT EXISTS idx_emails_received_at ON emails (received_at);
CREATE INDEX IF NOT EXISTS idx_emails_tenant_received ON emails (tenant_id, received_at);
