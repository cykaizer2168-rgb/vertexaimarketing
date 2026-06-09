-- Appointments (internal scheduling) for the CRM.
-- Run in Supabase SQL Editor: https://app.supabase.com -> SQL Editor

create table if not exists appointments (
  id           uuid default gen_random_uuid() primary key,
  created_at   timestamptz default now(),
  lead_id      uuid references leads(id) on delete cascade,
  title        text,
  type         text default 'assessment',   -- assessment | call | install | followup
  scheduled_at timestamptz not null,
  duration_min integer default 60,
  location     text,
  notes        text,
  status       text default 'scheduled',    -- scheduled | done | cancelled | no_show
  reminded_at  timestamptz
);

alter table appointments enable row level security;
create policy "Allow anon read appointments" on appointments for select using (true);
