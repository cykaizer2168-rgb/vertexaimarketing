-- ============================================================================
-- Vertex AI Marketing CRM — Blog Posts (portfolio blog / AdSense content)
-- Run once in Supabase SQL Editor (project: ejpmupwpoqkqkzfbjren)
-- Powers the CRM "Blog" section and the public portfolio /blog (articles).
-- ============================================================================

create table if not exists posts (
  id           uuid default gen_random_uuid() primary key,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now(),
  slug         text unique not null,
  title        text not null,
  excerpt      text,
  cover_image  text,
  body         text,                        -- markdown
  tags         jsonb default '[]'::jsonb,   -- ["NetSuite", "AI"]
  author       text default 'Angelo B. Franco',
  og_image     text,
  published    boolean default false,
  published_at timestamptz,
  sort_order   integer default 0
);

alter table posts enable row level security;

-- Public (anon) may read ONLY published posts — the portfolio build uses the anon key.
do $$ begin
  create policy "public read published posts"
    on posts for select using (published = true);
exception when duplicate_object then null; end $$;

-- Writes go through the CRM service-role key (bypasses RLS), guarded by requireAdmin().

create or replace function set_posts_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  -- stamp published_at the first time a post is published
  if new.published and (old.published is distinct from true) and new.published_at is null then
    new.published_at = now();
  end if;
  return new;
end;
$$ language plpgsql;

do $$ begin
  create trigger trg_posts_updated_at
    before update on posts
    for each row execute function set_posts_updated_at();
exception when duplicate_object then null; end $$;

-- ── Seed: a first welcome article so the blog isn't empty ────────────────────
insert into posts (slug, title, excerpt, body, tags, published, published_at, sort_order)
values (
  'welcome',
  'Building Smarter ERP Systems with AI Automation',
  'Why combining NetSuite ERP expertise with modern AI automation unlocks efficiency most businesses leave on the table.',
  E'For years, ERP systems like NetSuite have been the backbone of how companies run — orders, inventory, finance, fulfillment. But most teams still bolt manual work on top of them: copying data, chasing approvals, re-keying the same information across tools.\n\nThat is exactly where **AI automation** changes the game.\n\n## The opportunity\n\nModern automation platforms like n8n, combined with LLMs, can watch for events, make decisions, and take action across your systems — 24/7, without human babysitting.\n\n## What this blog covers\n\n- Practical NetSuite tips and implementation lessons\n- AI automation patterns you can apply today\n- Real case studies with measurable results\n\nStay tuned — new articles regularly.',
  '["AI Automation","NetSuite","ERP"]'::jsonb,
  true,
  now(),
  0
)
on conflict (slug) do nothing;
