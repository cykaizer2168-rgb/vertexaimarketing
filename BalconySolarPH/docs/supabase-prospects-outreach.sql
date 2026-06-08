-- AI Outreach execution + tracking: contact status fields on prospects.
-- Run in Supabase SQL Editor: https://app.supabase.com -> SQL Editor

alter table prospects add column if not exists outreach_status text default 'to_contact';
  -- to_contact | contacted | not_interested | follow_up  (interested -> converts to lead)
alter table prospects add column if not exists last_channel    text;        -- call | fb | email | sms
alter table prospects add column if not exists contacted_at     timestamptz;
alter table prospects add column if not exists outreach_notes   text;
