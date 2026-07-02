# Case Study Pages — Design

**Date:** 2026-07-02
**Project:** angelo-franco-portfolio (Vite 5 + React 18 + Tailwind v3 + Framer Motion)

## Goal

Make the "View Case Study" links in the Featured Projects (Selected Work) section
clickable, routing each project to its own blog-post-style page. Each page must be
**shareable on LinkedIn** — clicking a shared link opens the case study page, and the
LinkedIn share card shows a per-case-study title, description, and image.

## Key constraint: LinkedIn crawler needs real HTML

The site is a client-side React SPA (one `index.html` for all routes). LinkedIn's
crawler does not run JavaScript, so client-only routing would give every case study
the same generic OG preview. To get correct per-page previews we must emit a real
static HTML file per case study with its own OG meta baked in.

## Approach: `vite-react-ssg`

Use `vite-react-ssg` (React Router v6 + build-time static generation). Each route,
including dynamic `/case-studies/:slug`, is prerendered to a standalone HTML file with
per-page `<Head>` (OG/Twitter/canonical). Navigation stays SPA-like on the client.
Keeps the existing React + Tailwind + Framer stack. Chosen over plain client routing
(fails LinkedIn previews) and a Next.js migration (over-engineering; project is Vite).

## Architecture

- `src/main.jsx` — `export const createRoot = ViteReactSSG({ routes })`
- `src/routes.jsx` — RouteRecord array:
  - `/` → `Layout` (fixed background + Navbar + `<Outlet/>` + Footer)
    - index → `pages/Home.jsx` (current App section stack)
    - `case-studies/:slug` → `pages/CaseStudy.jsx`, with
      `getStaticPaths: () => caseStudies.map(c => \`case-studies/${c.slug}\`)`
- `src/components/Layout.jsx` — shared shell (bg + Navbar + Outlet + Footer)
- `src/data/caseStudies.js` — data model, one entry per case study:
  `{ slug, title, category, role, date, summary, hero: {type:'image'|'video', src, poster, alt},
     sections: [{heading, body}], results: [{value, label}], techStack: [], ogImage }`
- `src/pages/CaseStudy.jsx` — looks up slug, renders `<Head>` (OG meta) + article
  (back link, eyebrow, title, meta, hero media, structured sections, results grid,
  tech chips, Share-on-LinkedIn button, CTA). If slug not found → notFound / redirect home.

## Case study page layout (blog-post style)

Back to Projects · category eyebrow · H1 title · role/date meta · hero media
(image now, `<video controls>` when `type:'video'`) · Overview · The Challenge ·
The Solution · Architecture · Results (metric grid) · Tech Stack (chips) ·
Share on LinkedIn · CTA.

## Media

Hero supports image or video via `hero.type`. First case study (AI Automation) uses an
image placeholder in `public/`, swappable to a real screenshot/diagram or `.mp4` later.

## SEO / sharing

Per-page `<Head>`: title, description, canonical, og:type=article, og:title,
og:description, og:url, og:image (1200×630 branded PNG generated for the case study),
twitter:card=summary_large_image. Share button →
`https://www.linkedin.com/sharing/share-offsite/?url=<page url>`.

## Scope now

Full data-driven system built. First populated case study: **AI Automation & Workflow**
(`/case-studies/ai-automation`). Manufacturing, eCommerce, Tariff remain non-clickable
placeholders in Selected Work until populated later (add a data entry → clickable).

## Build / deploy

`package.json` build → `vite-react-ssg build`. Output: static HTML per route in `dist/`
(`dist/case-studies/ai-automation/index.html`). Deploy to `angelo-franco-portfolio.vercel.app`.
Verify OG tags exist in the raw prerendered HTML.
