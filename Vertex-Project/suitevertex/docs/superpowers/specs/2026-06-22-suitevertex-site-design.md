# SuiteVertex — Marketing Site Design Spec

**Date:** 2026-06-22
**Status:** Approved (brainstorming complete, pending spec review)
**Owner:** lukash0915

## 1. Summary

Build **SuiteVertex**, a marketing website for a NetSuite **managed-services + implementation** business. The model mirrors SuiteCrew's offer ("NetSuite work, on a monthly plan") — flat monthly retainer for ongoing NetSuite development (scripts, workflows, integrations, fixes) plus one-off implementation sprints — but with original SuiteVertex branding and original copy.

- **Brand:** SuiteVertex (new brand, not a clone of SuiteCrew visuals/copy)
- **Target market:** US mid-market finance & operations teams running NetSuite
- **Positioning line (working):** "NetSuite work, on a monthly plan."
- **Pricing model:** 3 monthly tiers + flat-rate implementation sprint
  - Starter — **$2,499/mo**
  - Growth — **$3,999/mo** (featured / "where most land")
  - Enterprise — **$6,499/mo**
  - Implementation sprint — **$4,999** flat (one-off project)

## 2. Goals & Non-Goals

**Goals**
- Production-grade, fast, SEO-friendly marketing site.
- Editable content (pricing, services, blog, careers, legal) via a hosted CMS for non-developers.
- Lead capture flowing into the existing Vertex CRM.
- Deployable to Vercel with auto-revalidation on content publish.

**Non-Goals (v1)**
- No customer login / client portal / dashboard.
- No e-commerce or online payment.
- No multi-language (English only at launch).
- No migration of SuiteCrew's copy verbatim (original copy only — avoid IP issues).

## 3. Tech Stack

- **Next.js 16** — App Router, React 19, TypeScript (strict). Server Components by default; `'use client'` only where interactivity is required.
- **Tailwind CSS v4** — `@import "tailwindcss"`, no `tailwind.config.*` file (match existing repo convention).
- **Sanity** — hosted CMS. Sanity Studio embedded at `/studio`; content fetched via GROQ using `next-sanity`.
- **lucide-react** — icons.
- **Deployment:** Vercel. ISR + tag-based revalidation; Sanity webhook → `revalidateTag` on publish.

> Implementation note: Before writing Next.js 16 / caching code, consult `node_modules/next/dist/docs/` and the Cache Components guidance — App Router APIs differ from older versions.

## 4. Architecture

### 4.1 Folder structure
```
app/
  (marketing)/
    page.tsx            → Home
    pricing/page.tsx
    how-it-works/page.tsx
    about/page.tsx
    contact/page.tsx
  blog/
    page.tsx            → Blog index
    [slug]/page.tsx     → Blog post
  careers/
    page.tsx            → Careers index
    [slug]/page.tsx     → Job listing
  legal/
    [slug]/page.tsx     → Terms / SLA / Privacy / Guarantee
  studio/[[...tool]]/page.tsx   → embedded Sanity Studio
  api/
    contact/route.ts    → POST → Vertex CRM
    revalidate/route.ts → Sanity webhook → revalidateTag
sanity/
  schemaTypes/          → content models (section 5)
  lib/                  → client.ts, queries.ts (GROQ), image.ts
  env.ts
components/
  layout/   → navbar, footer
  sections/ → hero, pricing-cards, comparison, services-grid, stats, faq, cta, social-proof
  ui/       → button, card, badge, container, etc.
lib/
  cms.ts    → typed fetch helpers
content/
  nav.ts    → static nav config + pricing fallback constants
```

### 4.2 Data flow
1. Page (Server Component) calls a typed GROQ query helper in `sanity/lib/queries.ts`.
2. Fetch is cached/tagged; tags map to document types (`post`, `job`, `pricingPlan`, etc.).
3. Editor publishes in Sanity → Sanity webhook hits `/api/revalidate` → `revalidateTag` refreshes affected pages.
4. Contact form (client component) → `POST /api/contact` → server forwards to Vertex CRM (section 7).

### 4.3 Isolation principles
- Each `sections/*` component renders one section, takes typed props, no internal data fetching — testable in isolation.
- All CMS access goes through `sanity/lib` + `lib/cms.ts`; pages never call the Sanity client directly.
- Static config (nav, fallbacks) lives in `content/` separate from CMS-driven content.

## 5. Sanity Content Model

| Schema | Type | Key fields | Drives |
|---|---|---|---|
| `siteSettings` | singleton | brandName, logo, tagline, contactEmail, socials, defaultSeo | Global metadata, header/footer |
| `pricingPlan` | document | name, price, cadence (`/mo` or flat), bestFor, featured (bool), features[], ctaLabel, order | Pricing tiers + sprint |
| `service` | document | title, description, icon, category (`managed` \| `implementation`), order | "What's in each plan" grid |
| `comparison` | document | optionLabel (A/B/C), title, body, costNote, order | "How most teams handle this today" |
| `stat` | document | value, label, order | Trust bar |
| `testimonial` | document | quote, name, role, company, logo | Social proof |
| `clientLogo` | document | name, logo, order | Logo strip |
| `faq` | document | question, answer, page (home \| pricing), order | FAQ sections |
| `post` | document | title, slug, excerpt, body (Portable Text), coverImage, author, publishedAt, seo | Blog |
| `job` | document | title, slug, location, employmentType, salaryRange, description (Portable Text), applyUrl, active | Careers |
| `legalPage` | document | title, slug, body (Portable Text), updatedAt | Terms/SLA/Privacy/Guarantee |
| `author` | document | name, role, avatar, bio | Blog author ref |

Portable Text rendered with a shared serializer component (headings, lists, links, images).

## 6. Pages & Sections

- **Home** — hero (headline + dual CTA: "Book intro call" / "See plans"), trust bar (`stat`), pricing teaser (3 `pricingPlan`), comparison block (A/B/C from `comparison`), "What we built instead" narrative, services grid (`service`), social proof (`testimonial` + `clientLogo`), FAQ (`faq` where page=home), closing CTA.
- **Pricing** — 3 monthly tiers + implementation sprint, full feature comparison table, pricing FAQ.
- **How it Works** — step sequence: onboarding → how to submit requests → response SLA (< 1 business day) → monthly cadence → cancel-anytime.
- **About** — story, team, certifications (e.g. Celigo), stats.
- **Contact** — lead form (→ Vertex CRM) + book-a-call CTA/embed.
- **Blog** — index (cards from `post`) + post detail (Portable Text).
- **Careers** — index (active `job` list) + job detail with apply CTA.
- **Legal** — dynamic `[slug]` from `legalPage`: terms, sla, privacy, guarantee.
- **Studio** — `/studio`, embedded Sanity editing UI.

## 7. Contact → Vertex CRM Integration

- `POST /api/contact` validates input (name, email, company, message, optional plan interest).
- Server action forwards the lead to the existing Vertex CRM lead endpoint (same pattern as current Vertex CRM lead creation). CRM base URL + API key stored as Vercel env vars (`VERTEX_CRM_URL`, `VERTEX_CRM_API_KEY`).
- On success: thank-you state; on failure: graceful error + fallback mailto.
- Spam protection: honeypot field + basic rate limit.
- **Open item (resolve in planning):** confirm exact Vertex CRM lead endpoint path, auth header, and payload shape.

## 8. Branding & Design System

- **Direction:** clean, premium B2B SaaS — trust + credibility. Light theme base.
- **Colors:** deep **navy/indigo** primary, **teal** accent, neutral grays, white surfaces. (Exact hex tokens finalized during build.)
- **Typography:** Inter (or close geometric-sans pairing) via `next/font`.
- **Components:** sticky navbar with CTA, pricing cards (featured highlight), comparison cards, animated stat counters, FAQ accordion, footer with nav + legal links.
- **Accessibility:** semantic HTML, sufficient contrast, keyboard-navigable nav/accordion, alt text on CMS images.

## 9. SEO & Performance

- Per-page `metadata` (title, description, OG) sourced from `siteSettings.defaultSeo` + page overrides.
- `sitemap.ts` + `robots.ts`; JSON-LD (Organization, WebSite) in root layout.
- `next/image` for all imagery (incl. Sanity image URLs); `next/font` for fonts.
- Target strong Core Web Vitals; mostly static/ISR rendering.

## 10. Testing

- No test runner currently configured in the repo; add **Vitest + React Testing Library** for component/unit tests of `sections/*` and CMS helpers.
- Lint via existing ESLint config.
- Manual verification: build, run, click through every page, submit contact form to a CRM test record.

## 11. Environment Variables

| Var | Purpose |
|---|---|
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | Sanity project |
| `NEXT_PUBLIC_SANITY_DATASET` | Sanity dataset (production) |
| `SANITY_API_READ_TOKEN` | Server-side GROQ reads |
| `SANITY_REVALIDATE_SECRET` | Verify revalidate webhook |
| `VERTEX_CRM_URL` | CRM lead endpoint base |
| `VERTEX_CRM_API_KEY` | CRM auth |

## 12. Open Questions (resolve during planning)

1. Exact Vertex CRM lead endpoint contract (path, auth, payload).
2. Book-a-call tool — Cal.com / Calendly / custom? (placeholder embed until decided)
3. Final color hex tokens + logo asset for SuiteVertex.
4. Domain for deployment.

## 13. Out of Scope / Future

- Client portal, billing/payments, multi-language, A/B testing, analytics dashboards — all post-v1.
