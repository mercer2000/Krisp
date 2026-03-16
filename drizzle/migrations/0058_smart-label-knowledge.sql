-- Add knowledge extraction columns to smart_labels
ALTER TABLE smart_labels
  ADD COLUMN extract_knowledge boolean NOT NULL DEFAULT false,
  ADD COLUMN clip_to_page_id uuid REFERENCES pages(id) ON DELETE SET NULL;
