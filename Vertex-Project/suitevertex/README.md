# SuiteVertex Marketing Site

Next.js 16 marketing site for SuiteVertex — a flat-monthly NetSuite managed-services platform targeting US mid-market finance and operations teams. Content is managed through a Sanity Studio embedded at `/studio`.

## Tech stack

- **Next.js 16.2.1** (App Router, Turbopack)
- **React 19**
- **Tailwind CSS v4**
- **Sanity v3** (content + Studio)
- **TypeScript** (strict)

---

## Required environment variables

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | Sanity project ID (found in sanity.io/manage) |
| `NEXT_PUBLIC_SANITY_DATASET` | Sanity dataset name — typically `production` |
| `SANITY_API_READ_TOKEN` | Sanity API token with Viewer role (for server-side fetches) |
| `SANITY_REVALIDATE_SECRET` | Arbitrary secret string shared with the Sanity webhook |
| `VERTEX_CRM_URL` | Base URL of the Vertex CRM endpoint that receives contact leads |
| `VERTEX_CRM_API_KEY` | API key for the Vertex CRM endpoint |

Copy `.env.local.example` to `.env.local` and fill in the values before running locally.

> **Note — Vertex CRM contract:** `lib/crm.ts` implements an assumed endpoint contract (POST JSON to `VERTEX_CRM_URL` with `Authorization: Bearer VERTEX_CRM_API_KEY`). This must be confirmed with the CRM team before go-live and the implementation updated accordingly.

---

## Install and run locally

```bash
npm install
cp .env.local.example .env.local   # fill in real values
npm run dev                         # http://localhost:3000
```

> **Build requirement:** `NEXT_PUBLIC_SANITY_PROJECT_ID` and `NEXT_PUBLIC_SANITY_DATASET` must be set to real values for a full production build. With a dummy project ID the slug pages and sitemap fall back to empty/dynamic rendering (no content), which is acceptable for a smoke build only.

---

## Sanity Studio

Studio is embedded at `/studio` on the running app (local or deployed). No separate deployment is needed.

- Local: http://localhost:3000/studio
- Production: https://yourdomain.com/studio

Log in with your Sanity account. Only users added to the project in sanity.io/manage can access it.

---

## Deploying to Vercel

1. Push the repo to GitHub/GitLab.
2. Import the project in the [Vercel dashboard](https://vercel.com/new).
3. Set all six environment variables listed above under **Settings → Environment Variables**.
4. Deploy — Vercel will run `npm run build` automatically.

The build command is `next build`. No extra configuration is needed; `next.config.ts` handles the rest.

---

## Sanity webhook — on-demand ISR revalidation

When editors publish content in Studio, Sanity should call the revalidation endpoint so Next.js purges the relevant cached tags.

1. In [sanity.io/manage](https://sanity.io/manage), open your project → **API → Webhooks → Add webhook**.
2. Set the URL to:
   ```
   https://yourdomain.com/api/revalidate?secret=YOUR_SANITY_REVALIDATE_SECRET
   ```
3. Set the HTTP method to **POST**.
4. Under **Trigger on**, enable **Create**, **Update**, and **Delete**.
5. Optionally filter by document type to reduce noise.
6. Save. Sanity will POST the document body (including `_type`) on each publish; the route calls `revalidateTag(_type)` to purge the matching Next.js cache.

---

## Available scripts

```bash
npm run dev        # Development server (Turbopack)
npm run build      # Production build
npm run start      # Start production server
npm run lint       # ESLint (source files only — avoid linting .next/)
npm test           # Vitest unit tests
npm run test:watch # Vitest in watch mode
```

---

## Post-v1 deferred items

These are intentionally not implemented in v1 and must be resolved before or shortly after launch:

> **LAUNCH BLOCKER — force-dynamic + ISR revalidation:** Several Sanity-fetching pages (e.g. `app/blog/page.tsx`, `app/blog/[slug]/page.tsx`) currently have `export const dynamic = "force-dynamic"` set for development convenience. **Before going to production, you MUST remove these `force-dynamic` exports** and set a real `NEXT_PUBLIC_SANITY_PROJECT_ID`. While `force-dynamic` is in place, Next.js bypasses the ISR tag cache entirely, so the `/api/revalidate` webhook (which calls `revalidateTag`) has NO EFFECT — editors will never see published content reflected without a full redeploy.

1. **Vertex CRM contract** — confirm endpoint path, auth scheme, and request payload; update `lib/crm.ts` and its test.
2. **Book-a-call tool** — embed Cal.com or Calendly on Contact/CTA once the vendor is chosen.
3. **Final brand tokens** — confirm color hex values and upload the logo asset to `siteSettings` in Studio.
4. **Deployment domain** — replace `https://suitevertex.com` placeholder in `app/sitemap.ts`, `app/robots.ts`, and JSON-LD structured data.
5. **Seed content** — create initial pricing plans, services, comparisons, stats, and FAQs in Studio.
