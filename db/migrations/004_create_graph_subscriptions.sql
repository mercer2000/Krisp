-- Migration: Create graph_subscriptions table for Microsoft Graph API webhook subscriptions
-- Tracks active change notification subscriptions per tenant for renewal and validation

CREATE TABLE IF NOT EXISTS graph_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subscription_id VARCHAR(512) NOT NULL,
  resource VARCHAR(512) NOT NULL,
  change_type VARCHAR(100) NOT NULL,
  client_state VARCHAR(255) NOT NULL,
  expiration_date_time TIMESTAMPTZ NOT NULL,
  notification_url TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_graph_subscription_id UNIQUE (subscription_id)
);

CREATE INDEX IF NOT EXISTS idx_graph_subscriptions_tenant ON graph_subscriptions (tenant_id);
CREATE INDEX IF NOT EXISTS idx_graph_subscriptions_expiration ON graph_subscriptions (expiration_date_time);
