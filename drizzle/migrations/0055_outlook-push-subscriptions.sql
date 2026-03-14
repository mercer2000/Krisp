ALTER TABLE graph_subscriptions
  ADD COLUMN outlook_oauth_token_id UUID
    REFERENCES outlook_oauth_tokens(id) ON DELETE SET NULL;

CREATE INDEX idx_graph_subscriptions_outlook_token
  ON graph_subscriptions(outlook_oauth_token_id);
