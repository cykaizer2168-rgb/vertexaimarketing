-- ============================================================================
-- Vertex Messenger Engine v2 — schema migration
-- Run in Supabase → SQL Editor.  Reversible (see DOWN section at the bottom).
-- ============================================================================

-- Per-PSID conversation state for the Messenger qualification bot.
create table if not exists conversation_state (
  psid         text primary key,
  lead_id      uuid references leads(id) on delete set null,
  state        text not null default 'NEW',   -- NEW|Q1|Q2|Q3|Q4|DONE|HUMAN
  q1_business  text,
  q2_need      text,
  q3_ticket    text,                           -- value of ONE closed sale
  q4_timeline  text,
  score        int,
  tier         text,                           -- HOT|WARM|NOT_FIT
  updated_at   timestamptz default now()
);

create index if not exists conversation_state_lead_id_idx on conversation_state (lead_id);
create index if not exists conversation_state_state_idx    on conversation_state (state);

-- Follow-up tracking: last time the CUSTOMER messaged (24-hour window anchor)
-- and how many proactive nudges we've already sent this conversation.
alter table conversation_state add column if not exists last_inbound_at timestamptz;
alter table conversation_state add column if not exists followups_sent  int default 0;

-- Link a lead to its Messenger PSID (nullable; only messenger leads have one).
alter table leads add column if not exists psid text;
create unique index if not exists leads_psid_key on leads (psid);

-- ============================================================================
-- DOWN (rollback) — run these to fully revert this migration:
--
--   drop index if exists leads_psid_key;
--   alter table leads drop column if exists psid;
--   alter table conversation_state drop column if exists last_inbound_at;
--   alter table conversation_state drop column if exists followups_sent;
--   drop table if exists conversation_state;
-- ============================================================================
