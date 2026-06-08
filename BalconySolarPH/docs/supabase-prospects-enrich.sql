-- AI Outreach enrichment: add FB page + ad-signal columns to prospects.
-- Run in Supabase SQL Editor: https://app.supabase.com -> SQL Editor

alter table prospects add column if not exists facebook     text;
alter table prospects add column if not exists runs_ads     boolean;
alter table prospects add column if not exists ad_platforms  text;   -- e.g. "Meta Pixel, Google Ads"
