-- ============================================================================
-- Vertex AI Marketing CRM — Case Studies (portfolio CMS)
-- Run once in Supabase SQL Editor (project: ejpmupwpoqkqkzfbjren)
-- Powers the "Case Studies" section of the CRM and the public portfolio site
-- (angelo-franco-portfolio) which reads published rows at build time.
-- ============================================================================

create table if not exists case_studies (
  id               uuid default gen_random_uuid() primary key,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now(),
  slug             text unique not null,
  title            text not null,
  category         text,
  role             text,
  date             text,
  summary          text,
  hero_type        text default 'image',   -- image | video
  hero_src         text,
  hero_poster      text,
  hero_alt         text,
  hero_placeholder boolean default true,
  og_image         text,
  sections         jsonb default '[]'::jsonb,  -- [{ "heading": "", "body": "" }]
  results          jsonb default '[]'::jsonb,  -- [{ "value": "", "label": "" }]
  tech_stack       jsonb default '[]'::jsonb,  -- ["n8n", "LLMs", ...]
  published        boolean default false,
  sort_order       integer default 0
);

alter table case_studies enable row level security;

-- Public (anon) may read ONLY published rows — the portfolio build uses the anon key.
do $$ begin
  create policy "public read published case studies"
    on case_studies for select using (published = true);
exception when duplicate_object then null; end $$;

-- Writes are performed by the CRM using the service-role key (bypasses RLS),
-- guarded by requireAdmin(). No anon insert/update/delete policy on purpose.

-- Keep updated_at fresh on every update.
create or replace function set_case_studies_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

do $$ begin
  create trigger trg_case_studies_updated_at
    before update on case_studies
    for each row execute function set_case_studies_updated_at();
exception when duplicate_object then null; end $$;

-- ── Seed: current portfolio case study ───────────────────────────────────────
insert into case_studies (
  slug, title, category, role, date, summary,
  hero_type, hero_src, hero_poster, hero_alt, hero_placeholder, og_image,
  sections, results, tech_stack, published, sort_order
) values (
  'ai-automation',
  'AI Automation & Workflow Orchestration',
  'AI Automation',
  'AI Automation Architect',
  '2026',
  'Designed and deployed AI agents and end-to-end automation workflows with n8n and LLMs to eliminate manual, repetitive business processes — cutting turnaround time and freeing the team to focus on higher-value work.',
  'image',
  '/case-studies/ai-automation-hero.jpg',
  '/case-studies/ai-automation-hero.jpg',
  'AI automation workflow built with n8n and LLMs',
  true,
  'https://angelo-franco-portfolio.vercel.app/case-studies/ai-automation-og.png',
  '[
    {"heading":"Overview","body":"A growing operations team was drowning in repetitive, manual tasks — copying data between systems, triaging inbound messages, and chasing follow-ups by hand. The goal was to design an AI-powered automation layer that could handle these workflows reliably, 24/7, without adding headcount. [Replace with your own overview.]"},
    {"heading":"The Challenge","body":"Data lived in disconnected tools, and every process depended on someone manually moving information from A to B. This created bottlenecks, delayed responses, and a high risk of human error. Any solution had to integrate with existing systems, be resilient to failures, and require minimal ongoing maintenance. [Replace with the real problem you solved.]"},
    {"heading":"The Solution","body":"I built a suite of automation workflows in n8n, orchestrating triggers, data transformations, and integrations across the client stack. Where judgment was needed — classification, summarization, drafting replies — I layered in LLM-powered steps with carefully engineered prompts and guardrails, so the AI acted consistently and safely. [Replace with your implementation details.]"},
    {"heading":"Architecture","body":"Event-driven workflows in n8n handle orchestration and integration; LLM nodes handle language tasks; and REST/webhook connections tie everything to the source systems. Retries, error branches, and logging make the pipeline observable and self-healing. [Describe your architecture — or swap the hero for an architecture diagram.]"}
  ]'::jsonb,
  '[
    {"value":"80%","label":"Manual work eliminated"},
    {"value":"24/7","label":"Always-on processing"},
    {"value":"10x","label":"Faster turnaround"}
  ]'::jsonb,
  '["n8n","LLMs / GPT","REST APIs","Webhooks","JavaScript","NetSuite"]'::jsonb,
  true,
  0
)
on conflict (slug) do nothing;
