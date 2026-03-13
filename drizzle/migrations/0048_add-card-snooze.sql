-- Add snooze fields to cards table
ALTER TABLE "cards" ADD COLUMN "snoozed_until" timestamp with time zone;
ALTER TABLE "cards" ADD COLUMN "snooze_return_column_id" uuid;
