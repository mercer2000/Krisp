ALTER TABLE outlook_oauth_tokens ADD COLUMN IF NOT EXISTS email_action_board_id uuid;
ALTER TABLE gmail_watch_subscriptions ADD COLUMN IF NOT EXISTS email_action_board_id uuid;
