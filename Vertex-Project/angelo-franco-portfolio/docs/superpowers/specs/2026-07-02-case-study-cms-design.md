# Case Study CMS (via vertexai-crm) — Design

**Date:** 2026-07-02
**Projects:** `vertexai-crm` (admin/CMS) + `angelo-franco-portfolio` (public site) + Supabase (`ejpmupwpoqkqkzfbjren`)

## Goal

Author/manage portfolio case studies from the existing **vertexai-crm** (already has
login + Supabase). Publishing triggers an auto-rebuild of the static portfolio so
LinkedIn-shareable per-page OG previews stay intact. Publish latency ~1–2 min.

## Data store — Supabase table `case_studies`

Columns: `id uuid pk`, `created_at`, `updated_at`, `slug unique`, `title`, `category`,
`role`, `date`, `summary`, `hero_type` (image|video), `hero_src`, `hero_poster`,
`hero_alt`, `hero_placeholder bool`, `og_image`, `sections jsonb` ([{heading,body}]),
`results jsonb` ([{value,label}]), `tech_stack jsonb` (string[]), `published bool`,
`sort_order int`.

RLS:
- Public `SELECT` where `published = true` (portfolio reads with anon key at build).
- Writes only via CRM service-role client (bypasses RLS), guarded by `requireAdmin()`.

Seed: insert the current "AI Automation & Workflow Orchestration" case study so nothing
disappears on first cutover.

## CRM (`vertexai-crm`) — admin UI

- **Sidebar** (`components/crm/sidebar.tsx`): add `Case Studies` → `/crm/case-studies`
  under a new `Content` section (icon: `FileText`).
- **Page** `app/crm/case-studies/page.tsx`: list (published/draft badges), New button,
  edit/delete, and a "Publish & Rebuild" action.
- **Form** `components/crm/case-study-form.tsx` (client): title, slug (auto from title),
  category, role, date, summary, hero (type image/video + src/poster/alt + placeholder
  toggle), dynamic `sections` (heading+body), dynamic `results` (value+label), `tech_stack`
  chips, `published` toggle.
- **API** (admin-guarded via `requireAdmin`, service-role `createAdminSupabase`):
  - `app/api/case-studies/route.ts` — GET list, POST create.
  - `app/api/case-studies/[id]/route.ts` — PUT update, DELETE.
  - On successful create/update, and via an explicit "Rebuild" button, POST the portfolio
    **Vercel Deploy Hook** (`PORTFOLIO_DEPLOY_HOOK_URL`) to trigger a rebuild.

Follows existing patterns: browser client for reads in list page is fine (public
published rows), but all writes go through the admin API using the service role.

## Portfolio (`angelo-franco-portfolio`) — public site, build-time fetch

- Add `@supabase/supabase-js`; `src/lib/supabase.js` = anon client from
  `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`.
- `src/data/caseStudies.js` → async fetchers `fetchPublishedCaseStudies()` and
  `fetchCaseStudy(slug)` that map DB snake_case → the component shape (nested `hero`
  object, etc.). **Local fallback** (current AI Automation object) if Supabase is
  unreachable, so the build never breaks.
- Routes (`src/routes.jsx`): React Router **loaders** (vite-react-ssg serializes loader
  data at build — confirmed by "Generating static loader data" in build output):
  - Home route `loader` → published case studies (for Selected Work).
  - `case-studies/:slug` route `loader` → one case study; `getStaticPaths` → published
    slugs.
- `SelectedWork.jsx` renders from loader data (published case studies) instead of the
  hardcoded array. `CaseStudy.jsx` uses `useLoaderData()` instead of `getCaseStudy`.

## Publish flow

CRM save (published) → deploy hook → portfolio rebuild (loaders + getStaticPaths fetch
Supabase) → live ~1–2 min, OG meta baked per page.

## Manual / infra steps

1. **Supabase SQL** (user runs in SQL Editor): create table + policies + seed. File:
   `vertexai-crm/docs/supabase-case-studies.sql`.
2. **Portfolio Vercel env**: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (public anon —
   reuse the CRM's values). Also `.env.local` for local builds.
3. **Deploy hook**: create for portfolio project; set `PORTFOLIO_DEPLOY_HOOK_URL` in CRM
   env.
4. Redeploy both projects.

## Resilience

- Build fallback to local default if Supabase down → site never breaks.
- Deploy-hook failure is non-blocking (logged), matching the CRM's webhook pattern.
