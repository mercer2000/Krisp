-- Add vector embedding column to zoom_chat_messages for semantic search
ALTER TABLE "zoom_chat_messages"
  ADD COLUMN "embedding" vector(1536),
  ADD COLUMN "embedding_generated_at" timestamp with time zone;
