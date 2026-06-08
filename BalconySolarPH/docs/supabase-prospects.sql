-- AI Outreach: staging table for scraped Google Maps prospects.
-- Run in Supabase SQL Editor: https://app.supabase.com -> SQL Editor

create table if not exists prospects (
  id            uuid default gen_random_uuid() primary key,
  created_at    timestamptz default now(),
  name          text not null,
  phone         text,
  website       text,
  email         text,
  address       text,
  area          text,
  business_type text,
  product       text,
  source        text default 'oxylabs_gmaps',
  source_url    text,
  external_id   text,
  ai_subject    text,
  ai_body       text,
  status        text default 'new',     -- new | approved | dismissed
  lead_id       uuid
);

-- Dedupe key (NULLs distinct, so blank ids never collide) -- mirrors messages.external_id
create unique index if not exists prospects_external_id_key on prospects (external_id);

-- CRM dashboard reads via anon; writes happen via service role on the server.
alter table prospects enable row level security;
create policy "Allow anon read prospects" on prospects for select using (true);
