ALTER TABLE "action_items" ADD COLUMN "card_id" uuid REFERENCES "cards"("id") ON DELETE SET NULL;
