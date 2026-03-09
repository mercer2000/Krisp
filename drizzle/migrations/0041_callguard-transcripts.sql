CREATE TABLE transcripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recording_id TEXT,
  application TEXT,
  start_time_utc TIMESTAMPTZ,
  end_time_utc TIMESTAMPTZ,
  duration TEXT,
  model_name TEXT,
  language TEXT,
  full_text TEXT,
  segments JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_transcripts_user ON transcripts (user_id);
CREATE INDEX idx_transcripts_recording ON transcripts (recording_id);

-- RLS policies
ALTER TABLE transcripts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "transcripts_select_policy" ON transcripts
  FOR SELECT TO authenticated
  USING (auth.user_id()::uuid = user_id);

CREATE POLICY "transcripts_insert_policy" ON transcripts
  FOR INSERT TO authenticated
  WITH CHECK (auth.user_id()::uuid = user_id);

CREATE POLICY "transcripts_update_policy" ON transcripts
  FOR UPDATE TO authenticated
  USING (auth.user_id()::uuid = user_id)
  WITH CHECK (auth.user_id()::uuid = user_id);

CREATE POLICY "transcripts_delete_policy" ON transcripts
  FOR DELETE TO authenticated
  USING (auth.user_id()::uuid = user_id);
