-- AI call logs table for inspecting AI prompts and responses
CREATE TABLE IF NOT EXISTS ai_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  trigger_type varchar(100) NOT NULL,
  prompt_key varchar(100),
  model varchar(100) NOT NULL,
  prompt text NOT NULL,
  response text NOT NULL,
  entity_type varchar(50),
  entity_id varchar(255),
  duration_ms integer,
  token_estimate integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_logs_user_created ON ai_logs (user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_ai_logs_trigger_type ON ai_logs (trigger_type);

-- RLS policies
ALTER TABLE ai_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ai_logs_select_own" ON ai_logs
  FOR SELECT TO authenticated
  USING (auth.user_id()::uuid = user_id);

CREATE POLICY "ai_logs_insert_own" ON ai_logs
  FOR INSERT TO authenticated
  WITH CHECK (auth.user_id()::uuid = user_id);

CREATE POLICY "ai_logs_update_own" ON ai_logs
  FOR UPDATE TO authenticated
  USING (auth.user_id()::uuid = user_id);

CREATE POLICY "ai_logs_delete_own" ON ai_logs
  FOR DELETE TO authenticated
  USING (auth.user_id()::uuid = user_id);
