-- Add Outlook folder sync fields to pages for smart rule integration
ALTER TABLE pages ADD COLUMN IF NOT EXISTS smart_rule_account_id uuid REFERENCES outlook_oauth_tokens(id) ON DELETE SET NULL;
ALTER TABLE pages ADD COLUMN IF NOT EXISTS smart_rule_folder_id varchar(255);
ALTER TABLE pages ADD COLUMN IF NOT EXISTS smart_rule_folder_name varchar(255);
