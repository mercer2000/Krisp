-- Add is_read column to emails (Outlook/Exchange)
ALTER TABLE "emails" ADD COLUMN "is_read" boolean DEFAULT false NOT NULL;

-- Add is_read column to gmail_emails
ALTER TABLE "gmail_emails" ADD COLUMN "is_read" boolean DEFAULT false NOT NULL;
