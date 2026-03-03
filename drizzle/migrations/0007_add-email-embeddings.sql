-- Enable pgvector extension for semantic search
CREATE EXTENSION IF NOT EXISTS vector;

-- Add embedding columns to emails table
ALTER TABLE emails
  ADD COLUMN embedding vector(1536),
  ADD COLUMN embedding_generated_at TIMESTAMPTZ;

-- Add HNSW index for fast cosine similarity search
CREATE INDEX idx_emails_embedding
  ON emails
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);
