-- AI Outreach: best-effort rating/review qualification fields.
-- Run in Supabase SQL Editor: https://app.supabase.com -> SQL Editor

alter table prospects add column if not exists rating        numeric;   -- e.g. 4.7
alter table prospects add column if not exists reviews_count  integer;   -- e.g. 320
