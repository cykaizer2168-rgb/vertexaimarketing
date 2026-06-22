# SuiteVertex Marketing Site Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the SuiteVertex marketing website — a NetSuite managed-services + implementation business site — as a Next.js 16 app with Sanity CMS, leads flowing to the Vertex CRM, deployed to Vercel.

**Architecture:** Fresh Next.js 16 App Router project at `Vertex-Project/suitevertex/`. Pages are Server Components that read content through typed GROQ helpers in `sanity/lib`. Presentational `sections/*` components receive typed props and never fetch. Content (pricing, services, blog, careers, legal) is editable in an embedded Sanity Studio at `/studio`. Contact submissions POST to `/api/contact`, which forwards to the Vertex CRM. Sanity publish webhooks hit `/api/revalidate` to refresh tagged pages.

**Tech Stack:** Next.js 16.2.1, React 19, TypeScript (strict), Tailwind CSS v4 (`@import "tailwindcss"`, no config file), Sanity v3 + `next-sanity`, `@portabletext/react`, lucide-react, class-variance-authority + clsx + tailwind-merge, framer-motion, Vitest + React Testing Library.

## Global Constraints

- Next.js **16.2.1** App Router; React **19.2.4**. Server Components by default; add `'use client'` only where interactivity is required.
- Tailwind CSS **v4** — use `@import "tailwindcss"` in global CSS; **no** `tailwind.config.*` file.
- Project root for all paths below: `Vertex-Project/suitevertex/`.
- This is **NOT** the Next.js in training data. Before writing any Next.js-specific code, read the relevant guide in `node_modules/next/dist/docs/` and heed deprecation notices.
- Original SuiteVertex copy only — do **not** copy SuiteCrew's wording verbatim.
- Brand: **SuiteVertex**, US mid-market NetSuite teams.
- Pricing (exact): Starter **$2,499/mo**, Growth **$3,999/mo** (featured), Enterprise **$6,499/mo**, Implementation sprint **$4,999** flat.
- Colors: deep navy/indigo primary, teal accent, neutral grays, white surfaces.
- Path alias: `@/*` → project root.
- Commit after every task with the message shown in its final step.

---

## File Structure

```
Vertex-Project/suitevertex/
  package.json, tsconfig.json, next.config.ts, postcss.config.mjs, .env.local.example, vitest.config.ts, vitest.setup.ts
  app/
    layout.tsx, globals.css, sitemap.ts, robots.ts
    (marketing)/page.tsx, pricing/page.tsx, how-it-works/page.tsx, about/page.tsx, contact/page.tsx
    blog/page.tsx, blog/[slug]/page.tsx
    careers/page.tsx, careers/[slug]/page.tsx
    legal/[slug]/page.tsx
    studio/[[...tool]]/page.tsx
    api/contact/route.ts, api/revalidate/route.ts
  sanity/
    env.ts, schema.ts, sanity.config.ts
    lib/client.ts, lib/image.ts, lib/queries.ts, lib/fetch.ts, lib/types.ts
    schemaTypes/{siteSettings,pricingPlan,service,comparison,stat,testimonial,clientLogo,faq,post,job,legalPage,author}.ts
  components/
    layout/{navbar,footer}.tsx
    sections/{hero,stats,pricing-cards,comparison,services-grid,social-proof,faq,cta}.tsx
    ui/{button,card,badge,container,section-heading}.tsx
    portable-text.tsx
  lib/{cn.ts, crm.ts, nav.ts}
  content/site.ts
```

---

## Phase 0 — Scaffold & Tooling

### Task 0: Project scaffold, dependencies, config, smoke build

**Files:**
- Create: `Vertex-Project/suitevertex/package.json`
- Create: `Vertex-Project/suitevertex/tsconfig.json`
- Create: `Vertex-Project/suitevertex/next.config.ts`
- Create: `Vertex-Project/suitevertex/postcss.config.mjs`
- Create: `Vertex-Project/suitevertex/app/globals.css`
- Create: `Vertex-Project/suitevertex/app/layout.tsx`
- Create: `Vertex-Project/suitevertex/app/(marketing)/page.tsx`
- Create: `Vertex-Project/suitevertex/.gitignore`
- Create: `Vertex-Project/suitevertex/.env.local.example`

**Interfaces:**
- Produces: a runnable Next.js app; `cn()` not yet (Task 1); root layout exporting `metadata`.

- [ ] **Step 1: Create the project directory and package.json**

```bash
mkdir -p Vertex-Project/suitevertex
cd Vertex-Project/suitevertex
```

`package.json`:
```json
{
  "name": "suitevertex",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "next": "16.2.1",
    "react": "19.2.4",
    "react-dom": "19.2.4",
    "next-sanity": "^9.8.0",
    "sanity": "^3.68.0",
    "@sanity/vision": "^3.68.0",
    "@sanity/image-url": "^1.1.0",
    "@portabletext/react": "^3.2.0",
    "styled-components": "^6.1.13",
    "lucide-react": "^1.0.1",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "tailwind-merge": "^3.6.0",
    "framer-motion": "^12.38.0"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4",
    "tailwindcss": "^4",
    "typescript": "^5",
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "eslint": "^9",
    "eslint-config-next": "16.2.1",
    "vitest": "^2.1.8",
    "@vitejs/plugin-react": "^4.3.4",
    "jsdom": "^25.0.1",
    "@testing-library/react": "^16.1.0",
    "@testing-library/jest-dom": "^6.6.3"
  }
}
```

- [ ] **Step 2: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 3: Create next.config.ts, postcss.config.mjs, .gitignore**

`next.config.ts` (note: NOT `output: 'export'` — we need API routes and Studio):
```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{ protocol: "https", hostname: "cdn.sanity.io" }],
  },
};

export default nextConfig;
```

`postcss.config.mjs`:
```js
const config = { plugins: ["@tailwindcss/postcss"] };
export default config;
```

`.gitignore`:
```
node_modules
.next
.env.local
.env*.local
*.tsbuildinfo
next-env.d.ts
```

- [ ] **Step 4: Create globals.css with Tailwind v4 + brand tokens**

`app/globals.css`:
```css
@import "tailwindcss";

@theme {
  --color-navy-950: #0a0f1f;
  --color-navy-900: #0f172a;
  --color-navy-800: #1e293b;
  --color-indigo-600: #4f46e5;
  --color-indigo-500: #6366f1;
  --color-teal-500: #14b8a6;
  --color-teal-400: #2dd4bf;
  --font-sans: var(--font-inter), ui-sans-serif, system-ui, sans-serif;
}

html { scroll-behavior: smooth; }
body { @apply bg-white text-navy-900 antialiased; }
```

- [ ] **Step 5: Create root layout and a placeholder home page**

`app/layout.tsx`:
```tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: { default: "SuiteVertex — NetSuite work, on a monthly plan", template: "%s | SuiteVertex" },
  description: "Managed NetSuite development and implementation for US mid-market teams. Flat monthly plans, senior engineers.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans">{children}</body>
    </html>
  );
}
```

`app/(marketing)/page.tsx`:
```tsx
export default function HomePage() {
  return <main className="p-10"><h1 className="text-3xl font-bold">SuiteVertex</h1></main>;
}
```

`.env.local.example`:
```
NEXT_PUBLIC_SANITY_PROJECT_ID=
NEXT_PUBLIC_SANITY_DATASET=production
SANITY_API_READ_TOKEN=
SANITY_REVALIDATE_SECRET=
VERTEX_CRM_URL=
VERTEX_CRM_API_KEY=
```

- [ ] **Step 6: Install dependencies**

Run: `cd Vertex-Project/suitevertex && npm install`
Expected: completes; `node_modules` and `package-lock.json` created.

- [ ] **Step 7: Verify the app builds and runs**

Run: `cd Vertex-Project/suitevertex && npm run build`
Expected: build succeeds; route `/` listed in output.

- [ ] **Step 8: Commit**

```bash
cd Vertex-Project/suitevertex
git add -A
git commit -m "chore(suitevertex): scaffold Next.js 16 + Tailwind v4 project"
```

---

## Phase 1 — UI Primitives, Test Harness & Layout

### Task 1: Test harness + `cn()` utility

**Files:**
- Create: `Vertex-Project/suitevertex/vitest.config.ts`
- Create: `Vertex-Project/suitevertex/vitest.setup.ts`
- Create: `Vertex-Project/suitevertex/lib/cn.ts`
- Test: `Vertex-Project/suitevertex/lib/cn.test.ts`

**Interfaces:**
- Produces: `cn(...inputs: ClassValue[]): string` — merges Tailwind classes via clsx + tailwind-merge.

- [ ] **Step 1: Create vitest config and setup**

`vitest.config.ts`:
```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  test: { environment: "jsdom", setupFiles: ["./vitest.setup.ts"], globals: true },
  resolve: { alias: { "@": path.resolve(__dirname, ".") } },
});
```

`vitest.setup.ts`:
```ts
import "@testing-library/jest-dom/vitest";
```

- [ ] **Step 2: Write the failing test**

`lib/cn.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { cn } from "./cn";

describe("cn", () => {
  it("merges class names", () => {
    expect(cn("a", "b")).toBe("a b");
  });
  it("dedupes conflicting tailwind classes (last wins)", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
  });
  it("drops falsy values", () => {
    expect(cn("a", false && "b", undefined, "c")).toBe("a c");
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `cd Vertex-Project/suitevertex && npx vitest run lib/cn.test.ts`
Expected: FAIL — cannot find module `./cn`.

- [ ] **Step 4: Implement cn**

`lib/cn.ts`:
```ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `cd Vertex-Project/suitevertex && npx vitest run lib/cn.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "test(suitevertex): add vitest harness + cn utility"
```

### Task 2: UI primitives (Button, Card, Badge, Container, SectionHeading)

**Files:**
- Create: `Vertex-Project/suitevertex/components/ui/button.tsx`
- Create: `Vertex-Project/suitevertex/components/ui/card.tsx`
- Create: `Vertex-Project/suitevertex/components/ui/badge.tsx`
- Create: `Vertex-Project/suitevertex/components/ui/container.tsx`
- Create: `Vertex-Project/suitevertex/components/ui/section-heading.tsx`
- Test: `Vertex-Project/suitevertex/components/ui/button.test.tsx`

**Interfaces:**
- Consumes: `cn` from `@/lib/cn`.
- Produces:
  - `Button` props: `{ variant?: "primary" | "outline" | "ghost"; size?: "sm" | "md" | "lg"; asChild?: false } & ButtonHTMLAttributes` and an `as="a"` variant via `href`. For simplicity expose `Button` (renders `<button>`) and `ButtonLink` (renders `<a>`), both taking `variant`/`size`.
  - `Container` props: `{ className?; children }` → centered max-width wrapper.
  - `Card` props: `{ className?; children }`.
  - `Badge` props: `{ className?; children }`.
  - `SectionHeading` props: `{ eyebrow?: string; title: string; subtitle?: string; align?: "left" | "center" }`.

- [ ] **Step 1: Write the failing test**

`components/ui/button.test.tsx`:
```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Button, ButtonLink } from "./button";

describe("Button", () => {
  it("renders its children", () => {
    render(<Button>Book intro call</Button>);
    expect(screen.getByRole("button", { name: "Book intro call" })).toBeInTheDocument();
  });
  it("ButtonLink renders an anchor with href", () => {
    render(<ButtonLink href="/pricing">See plans</ButtonLink>);
    const link = screen.getByRole("link", { name: "See plans" });
    expect(link).toHaveAttribute("href", "/pricing");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd Vertex-Project/suitevertex && npx vitest run components/ui/button.test.tsx`
Expected: FAIL — cannot find `./button`.

- [ ] **Step 3: Implement the primitives**

`components/ui/button.tsx`:
```tsx
import { cva, type VariantProps } from "class-variance-authority";
import Link from "next/link";
import { cn } from "@/lib/cn";
import type { ButtonHTMLAttributes, AnchorHTMLAttributes } from "react";

const button = cva(
  "inline-flex items-center justify-center rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-indigo-600 text-white hover:bg-indigo-500",
        outline: "border border-navy-800/20 text-navy-900 hover:bg-navy-900/5",
        ghost: "text-navy-900 hover:bg-navy-900/5",
      },
      size: { sm: "h-9 px-4 text-sm", md: "h-11 px-5 text-sm", lg: "h-12 px-6 text-base" },
    },
    defaultVariants: { variant: "primary", size: "md" },
  }
);

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof button>;
export function Button({ className, variant, size, ...props }: ButtonProps) {
  return <button className={cn(button({ variant, size }), className)} {...props} />;
}

type ButtonLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & VariantProps<typeof button> & { href: string };
export function ButtonLink({ className, variant, size, href, ...props }: ButtonLinkProps) {
  return <Link href={href} className={cn(button({ variant, size }), className)} {...props} />;
}
```

`components/ui/container.tsx`:
```tsx
import { cn } from "@/lib/cn";
export function Container({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("mx-auto w-full max-w-6xl px-6", className)}>{children}</div>;
}
```

`components/ui/card.tsx`:
```tsx
import { cn } from "@/lib/cn";
export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("rounded-2xl border border-navy-800/10 bg-white p-6 shadow-sm", className)}>{children}</div>;
}
```

`components/ui/badge.tsx`:
```tsx
import { cn } from "@/lib/cn";
export function Badge({ className, children }: { className?: string; children: React.ReactNode }) {
  return <span className={cn("inline-flex items-center rounded-full bg-teal-500/10 px-3 py-1 text-xs font-medium text-teal-600", className)}>{children}</span>;
}
```

`components/ui/section-heading.tsx`:
```tsx
import { cn } from "@/lib/cn";
import { Badge } from "./badge";
export function SectionHeading({ eyebrow, title, subtitle, align = "center" }: { eyebrow?: string; title: string; subtitle?: string; align?: "left" | "center"; }) {
  return (
    <div className={cn("max-w-2xl", align === "center" && "mx-auto text-center")}>
      {eyebrow && <Badge className="mb-4">{eyebrow}</Badge>}
      <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{title}</h2>
      {subtitle && <p className="mt-4 text-lg text-navy-800/70">{subtitle}</p>}
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd Vertex-Project/suitevertex && npx vitest run components/ui/button.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(suitevertex): UI primitives (button, card, badge, container, heading)"
```

### Task 3: Static site config, nav, Navbar & Footer

**Files:**
- Create: `Vertex-Project/suitevertex/content/site.ts`
- Create: `Vertex-Project/suitevertex/lib/nav.ts`
- Create: `Vertex-Project/suitevertex/components/layout/navbar.tsx`
- Create: `Vertex-Project/suitevertex/components/layout/footer.tsx`
- Modify: `Vertex-Project/suitevertex/app/layout.tsx`
- Test: `Vertex-Project/suitevertex/components/layout/footer.test.tsx`

**Interfaces:**
- Consumes: `Container`, `ButtonLink`.
- Produces:
  - `SITE` constant: `{ name: "SuiteVertex"; tagline: string; email: string; cta: { book: string; plans: string } }`.
  - `MAIN_NAV: { label: string; href: string }[]`, `FOOTER_LEGAL: { label: string; href: string }[]`.
  - `<Navbar />`, `<Footer />` components.

- [ ] **Step 1: Create site config and nav**

`content/site.ts`:
```ts
export const SITE = {
  name: "SuiteVertex",
  tagline: "NetSuite work, on a monthly plan.",
  email: "hello@suitevertex.com",
  cta: { book: "Book intro call", plans: "See plans" },
} as const;
```

`lib/nav.ts`:
```ts
export const MAIN_NAV = [
  { label: "Pricing", href: "/pricing" },
  { label: "How it works", href: "/how-it-works" },
  { label: "About", href: "/about" },
  { label: "Blog", href: "/blog" },
  { label: "Careers", href: "/careers" },
  { label: "Contact", href: "/contact" },
] as const;

export const FOOTER_LEGAL = [
  { label: "Terms", href: "/legal/terms" },
  { label: "SLA", href: "/legal/sla" },
  { label: "Privacy", href: "/legal/privacy" },
  { label: "Money-back guarantee", href: "/legal/guarantee" },
] as const;
```

- [ ] **Step 2: Write the failing test**

`components/layout/footer.test.tsx`:
```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Footer } from "./footer";

describe("Footer", () => {
  it("shows the brand name and legal links", () => {
    render(<Footer />);
    expect(screen.getByText("SuiteVertex")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Terms" })).toHaveAttribute("href", "/legal/terms");
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `cd Vertex-Project/suitevertex && npx vitest run components/layout/footer.test.tsx`
Expected: FAIL — cannot find `./footer`.

- [ ] **Step 4: Implement Navbar and Footer**

`components/layout/navbar.tsx`:
```tsx
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { ButtonLink } from "@/components/ui/button";
import { MAIN_NAV } from "@/lib/nav";
import { SITE } from "@/content/site";

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-navy-800/10 bg-white/80 backdrop-blur">
      <Container className="flex h-16 items-center justify-between">
        <Link href="/" className="text-lg font-bold tracking-tight">{SITE.name}</Link>
        <nav className="hidden items-center gap-6 md:flex">
          {MAIN_NAV.map((i) => (
            <Link key={i.href} href={i.href} className="text-sm text-navy-800/70 hover:text-navy-900">{i.label}</Link>
          ))}
        </nav>
        <ButtonLink href="/contact" size="sm">{SITE.cta.book}</ButtonLink>
      </Container>
    </header>
  );
}
```

`components/layout/footer.tsx`:
```tsx
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { MAIN_NAV, FOOTER_LEGAL } from "@/lib/nav";
import { SITE } from "@/content/site";

export function Footer() {
  return (
    <footer className="border-t border-navy-800/10 bg-navy-950 text-white">
      <Container className="grid gap-8 py-12 md:grid-cols-3">
        <div>
          <p className="text-lg font-bold">{SITE.name}</p>
          <p className="mt-2 text-sm text-white/60">{SITE.tagline}</p>
        </div>
        <nav className="flex flex-col gap-2">
          {MAIN_NAV.map((i) => (
            <Link key={i.href} href={i.href} className="text-sm text-white/70 hover:text-white">{i.label}</Link>
          ))}
        </nav>
        <nav className="flex flex-col gap-2">
          {FOOTER_LEGAL.map((i) => (
            <Link key={i.href} href={i.href} className="text-sm text-white/70 hover:text-white">{i.label}</Link>
          ))}
        </nav>
      </Container>
      <Container className="border-t border-white/10 py-6 text-xs text-white/40">© {new Date().getFullYear()} {SITE.name}. All rights reserved.</Container>
    </footer>
  );
}
```

- [ ] **Step 5: Wire Navbar/Footer into the marketing layout**

Create `app/(marketing)/layout.tsx`:
```tsx
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      {children}
      <Footer />
    </>
  );
}
```

- [ ] **Step 6: Run test to verify it passes**

Run: `cd Vertex-Project/suitevertex && npx vitest run components/layout/footer.test.tsx`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "feat(suitevertex): site config, navbar, footer, marketing layout"
```

---

## Phase 2 — Sanity Setup

### Task 4: Sanity env, client, image helper, Studio route

**Files:**
- Create: `Vertex-Project/suitevertex/sanity/env.ts`
- Create: `Vertex-Project/suitevertex/sanity/lib/client.ts`
- Create: `Vertex-Project/suitevertex/sanity/lib/image.ts`
- Create: `Vertex-Project/suitevertex/sanity/schema.ts`
- Create: `Vertex-Project/suitevertex/sanity.config.ts`
- Create: `Vertex-Project/suitevertex/app/studio/[[...tool]]/page.tsx`
- Test: `Vertex-Project/suitevertex/sanity/lib/image.test.ts`

**Interfaces:**
- Produces:
  - `projectId`, `dataset`, `apiVersion` from `sanity/env.ts`.
  - `client` (configured `createClient` instance) from `sanity/lib/client.ts`.
  - `urlFor(source): ImageUrlBuilder` from `sanity/lib/image.ts`.
  - `schema: { types: [] }` from `sanity/schema.ts` (populated in Task 5).

- [ ] **Step 1: Create env and client**

`sanity/env.ts`:
```ts
export const apiVersion = "2024-10-01";
export const dataset = assertValue(process.env.NEXT_PUBLIC_SANITY_DATASET, "Missing NEXT_PUBLIC_SANITY_DATASET");
export const projectId = assertValue(process.env.NEXT_PUBLIC_SANITY_PROJECT_ID, "Missing NEXT_PUBLIC_SANITY_PROJECT_ID");

function assertValue<T>(v: T | undefined, msg: string): T {
  if (v === undefined) throw new Error(msg);
  return v;
}
```

`sanity/lib/client.ts`:
```ts
import { createClient } from "next-sanity";
import { apiVersion, dataset, projectId } from "../env";

export const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: true,
});
```

- [ ] **Step 2: Write the failing test**

`sanity/lib/image.test.ts`:
```ts
import { describe, it, expect, vi } from "vitest";

vi.stubEnv("NEXT_PUBLIC_SANITY_PROJECT_ID", "testproj");
vi.stubEnv("NEXT_PUBLIC_SANITY_DATASET", "production");

describe("urlFor", () => {
  it("builds a cdn url for an image ref", async () => {
    const { urlFor } = await import("./image");
    const url = urlFor({ asset: { _ref: "image-abc123-200x200-png" } }).width(100).url();
    expect(url).toContain("cdn.sanity.io");
    expect(url).toContain("testproj");
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `cd Vertex-Project/suitevertex && npx vitest run sanity/lib/image.test.ts`
Expected: FAIL — cannot find `./image`.

- [ ] **Step 4: Implement image helper, schema stub, config, studio route**

`sanity/lib/image.ts`:
```ts
import createImageUrlBuilder from "@sanity/image-url";
import type { SanityImageSource } from "@sanity/image-url/lib/types/types";
import { dataset, projectId } from "../env";

const builder = createImageUrlBuilder({ projectId, dataset });
export const urlFor = (source: SanityImageSource) => builder.image(source);
```

`sanity/schema.ts`:
```ts
import type { SchemaTypeDefinition } from "sanity";

export const schema: { types: SchemaTypeDefinition[] } = { types: [] };
```

`sanity.config.ts`:
```ts
"use client";
import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { visionTool } from "@sanity/vision";
import { apiVersion, dataset, projectId } from "./sanity/env";
import { schema } from "./sanity/schema";

export default defineConfig({
  basePath: "/studio",
  projectId,
  dataset,
  schema,
  plugins: [structureTool(), visionTool({ defaultApiVersion: apiVersion })],
});
```

`app/studio/[[...tool]]/page.tsx`:
```tsx
import { NextStudio } from "next-sanity/studio";
import config from "@/sanity.config";

export const dynamic = "force-static";
export { metadata, viewport } from "next-sanity/studio";

export default function StudioPage() {
  return <NextStudio config={config} />;
}
```

> Implementation note: confirm the `next-sanity/studio` export names against the installed version's docs before finalizing.

- [ ] **Step 5: Run test to verify it passes**

Run: `cd Vertex-Project/suitevertex && npx vitest run sanity/lib/image.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat(suitevertex): sanity client, image helper, embedded studio route"
```

### Task 5: Sanity schema types

**Files:**
- Create: `Vertex-Project/suitevertex/sanity/schemaTypes/{siteSettings,pricingPlan,service,comparison,stat,testimonial,clientLogo,faq,post,job,legalPage,author}.ts`
- Modify: `Vertex-Project/suitevertex/sanity/schema.ts`
- Test: `Vertex-Project/suitevertex/sanity/schema.test.ts`

**Interfaces:**
- Consumes: nothing new.
- Produces: `schema.types` array containing all 12 document/singleton schemas, each with a stable `name` matching the table in section 5 of the spec.

- [ ] **Step 1: Write the failing test**

`sanity/schema.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { schema } from "./schema";

const expected = ["siteSettings","pricingPlan","service","comparison","stat","testimonial","clientLogo","faq","post","job","legalPage","author"];

describe("schema", () => {
  it("registers all content types", () => {
    const names = schema.types.map((t) => (t as { name: string }).name);
    for (const n of expected) expect(names).toContain(n);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd Vertex-Project/suitevertex && npx vitest run sanity/schema.test.ts`
Expected: FAIL — names array empty.

- [ ] **Step 3: Implement the schema types**

`sanity/schemaTypes/siteSettings.ts`:
```ts
import { defineField, defineType } from "sanity";
export const siteSettings = defineType({
  name: "siteSettings", title: "Site Settings", type: "document",
  fields: [
    defineField({ name: "brandName", type: "string", initialValue: "SuiteVertex" }),
    defineField({ name: "tagline", type: "string" }),
    defineField({ name: "logo", type: "image" }),
    defineField({ name: "contactEmail", type: "string" }),
    defineField({ name: "twitter", type: "url" }),
    defineField({ name: "linkedin", type: "url" }),
    defineField({ name: "seoDescription", type: "text", rows: 2 }),
  ],
});
```

`sanity/schemaTypes/pricingPlan.ts`:
```ts
import { defineField, defineType } from "sanity";
export const pricingPlan = defineType({
  name: "pricingPlan", title: "Pricing Plan", type: "document",
  fields: [
    defineField({ name: "name", type: "string", validation: (r) => r.required() }),
    defineField({ name: "price", type: "string", description: "e.g. $2,499", validation: (r) => r.required() }),
    defineField({ name: "cadence", type: "string", options: { list: ["/mo", "flat"] }, initialValue: "/mo" }),
    defineField({ name: "bestFor", type: "string" }),
    defineField({ name: "featured", type: "boolean", initialValue: false }),
    defineField({ name: "features", type: "array", of: [{ type: "string" }] }),
    defineField({ name: "ctaLabel", type: "string", initialValue: "Book intro call" }),
    defineField({ name: "order", type: "number" }),
  ],
  orderings: [{ name: "order", title: "Order", by: [{ field: "order", direction: "asc" }] }],
});
```

`sanity/schemaTypes/service.ts`:
```ts
import { defineField, defineType } from "sanity";
export const service = defineType({
  name: "service", title: "Service", type: "document",
  fields: [
    defineField({ name: "title", type: "string", validation: (r) => r.required() }),
    defineField({ name: "description", type: "text", rows: 3 }),
    defineField({ name: "icon", type: "string", description: "lucide-react icon name" }),
    defineField({ name: "category", type: "string", options: { list: ["managed", "implementation"] } }),
    defineField({ name: "order", type: "number" }),
  ],
});
```

`sanity/schemaTypes/comparison.ts`:
```ts
import { defineField, defineType } from "sanity";
export const comparison = defineType({
  name: "comparison", title: "Comparison Option", type: "document",
  fields: [
    defineField({ name: "optionLabel", type: "string", description: "e.g. Option A · Hire someone" }),
    defineField({ name: "title", type: "string" }),
    defineField({ name: "body", type: "text", rows: 3 }),
    defineField({ name: "costNote", type: "string" }),
    defineField({ name: "order", type: "number" }),
  ],
});
```

`sanity/schemaTypes/stat.ts`:
```ts
import { defineField, defineType } from "sanity";
export const stat = defineType({
  name: "stat", title: "Stat", type: "document",
  fields: [
    defineField({ name: "value", type: "string", description: "e.g. 20+" }),
    defineField({ name: "label", type: "string" }),
    defineField({ name: "order", type: "number" }),
  ],
});
```

`sanity/schemaTypes/testimonial.ts`:
```ts
import { defineField, defineType } from "sanity";
export const testimonial = defineType({
  name: "testimonial", title: "Testimonial", type: "document",
  fields: [
    defineField({ name: "quote", type: "text", rows: 3 }),
    defineField({ name: "name", type: "string" }),
    defineField({ name: "role", type: "string" }),
    defineField({ name: "company", type: "string" }),
    defineField({ name: "logo", type: "image" }),
  ],
});
```

`sanity/schemaTypes/clientLogo.ts`:
```ts
import { defineField, defineType } from "sanity";
export const clientLogo = defineType({
  name: "clientLogo", title: "Client Logo", type: "document",
  fields: [
    defineField({ name: "name", type: "string" }),
    defineField({ name: "logo", type: "image" }),
    defineField({ name: "order", type: "number" }),
  ],
});
```

`sanity/schemaTypes/faq.ts`:
```ts
import { defineField, defineType } from "sanity";
export const faq = defineType({
  name: "faq", title: "FAQ", type: "document",
  fields: [
    defineField({ name: "question", type: "string" }),
    defineField({ name: "answer", type: "text", rows: 3 }),
    defineField({ name: "page", type: "string", options: { list: ["home", "pricing"] }, initialValue: "home" }),
    defineField({ name: "order", type: "number" }),
  ],
});
```

`sanity/schemaTypes/author.ts`:
```ts
import { defineField, defineType } from "sanity";
export const author = defineType({
  name: "author", title: "Author", type: "document",
  fields: [
    defineField({ name: "name", type: "string", validation: (r) => r.required() }),
    defineField({ name: "role", type: "string" }),
    defineField({ name: "avatar", type: "image" }),
    defineField({ name: "bio", type: "text", rows: 3 }),
  ],
});
```

`sanity/schemaTypes/post.ts`:
```ts
import { defineField, defineType } from "sanity";
export const post = defineType({
  name: "post", title: "Blog Post", type: "document",
  fields: [
    defineField({ name: "title", type: "string", validation: (r) => r.required() }),
    defineField({ name: "slug", type: "slug", options: { source: "title" }, validation: (r) => r.required() }),
    defineField({ name: "excerpt", type: "text", rows: 2 }),
    defineField({ name: "coverImage", type: "image", options: { hotspot: true } }),
    defineField({ name: "author", type: "reference", to: [{ type: "author" }] }),
    defineField({ name: "publishedAt", type: "datetime", validation: (r) => r.required() }),
    defineField({ name: "body", type: "array", of: [{ type: "block" }, { type: "image" }] }),
    defineField({ name: "seoDescription", type: "text", rows: 2 }),
  ],
  orderings: [{ name: "publishedDesc", title: "Newest", by: [{ field: "publishedAt", direction: "desc" }] }],
});
```

`sanity/schemaTypes/job.ts`:
```ts
import { defineField, defineType } from "sanity";
export const job = defineType({
  name: "job", title: "Job", type: "document",
  fields: [
    defineField({ name: "title", type: "string", validation: (r) => r.required() }),
    defineField({ name: "slug", type: "slug", options: { source: "title" }, validation: (r) => r.required() }),
    defineField({ name: "location", type: "string" }),
    defineField({ name: "employmentType", type: "string", options: { list: ["Full-time", "Part-time", "Contract", "Fractional"] } }),
    defineField({ name: "salaryRange", type: "string" }),
    defineField({ name: "active", type: "boolean", initialValue: true }),
    defineField({ name: "applyUrl", type: "url" }),
    defineField({ name: "description", type: "array", of: [{ type: "block" }] }),
  ],
});
```

`sanity/schemaTypes/legalPage.ts`:
```ts
import { defineField, defineType } from "sanity";
export const legalPage = defineType({
  name: "legalPage", title: "Legal Page", type: "document",
  fields: [
    defineField({ name: "title", type: "string", validation: (r) => r.required() }),
    defineField({ name: "slug", type: "slug", options: { source: "title" }, validation: (r) => r.required() }),
    defineField({ name: "updatedAt", type: "datetime" }),
    defineField({ name: "body", type: "array", of: [{ type: "block" }] }),
  ],
});
```

- [ ] **Step 4: Register all types in schema.ts**

`sanity/schema.ts`:
```ts
import type { SchemaTypeDefinition } from "sanity";
import { siteSettings } from "./schemaTypes/siteSettings";
import { pricingPlan } from "./schemaTypes/pricingPlan";
import { service } from "./schemaTypes/service";
import { comparison } from "./schemaTypes/comparison";
import { stat } from "./schemaTypes/stat";
import { testimonial } from "./schemaTypes/testimonial";
import { clientLogo } from "./schemaTypes/clientLogo";
import { faq } from "./schemaTypes/faq";
import { post } from "./schemaTypes/post";
import { job } from "./schemaTypes/job";
import { legalPage } from "./schemaTypes/legalPage";
import { author } from "./schemaTypes/author";

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [siteSettings, pricingPlan, service, comparison, stat, testimonial, clientLogo, faq, post, job, legalPage, author],
};
```

- [ ] **Step 5: Run test to verify it passes**

Run: `cd Vertex-Project/suitevertex && npx vitest run sanity/schema.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat(suitevertex): sanity content schemas (12 types)"
```

---

## Phase 3 — CMS Query Layer

### Task 6: GROQ queries, typed fetch wrapper, content types

**Files:**
- Create: `Vertex-Project/suitevertex/sanity/lib/types.ts`
- Create: `Vertex-Project/suitevertex/sanity/lib/queries.ts`
- Create: `Vertex-Project/suitevertex/sanity/lib/fetch.ts`
- Test: `Vertex-Project/suitevertex/sanity/lib/fetch.test.ts`

**Interfaces:**
- Consumes: `client` from `sanity/lib/client.ts`.
- Produces:
  - Types in `types.ts`: `PricingPlan`, `Service`, `Comparison`, `Stat`, `Testimonial`, `ClientLogo`, `Faq`, `PostListItem`, `Post`, `JobListItem`, `Job`, `LegalPage`, `SiteSettings`.
  - Query strings in `queries.ts`: `PRICING_PLANS_QUERY`, `SERVICES_QUERY`, `COMPARISONS_QUERY`, `STATS_QUERY`, `TESTIMONIALS_QUERY`, `CLIENT_LOGOS_QUERY`, `FAQS_QUERY(page)`, `POSTS_QUERY`, `POST_QUERY`, `POST_SLUGS_QUERY`, `JOBS_QUERY`, `JOB_QUERY`, `JOB_SLUGS_QUERY`, `LEGAL_QUERY`, `LEGAL_SLUGS_QUERY`, `SITE_SETTINGS_QUERY`.
  - `sanityFetch<T>({ query, params?, tags }): Promise<T>` from `fetch.ts`.

- [ ] **Step 1: Create content types**

`sanity/lib/types.ts`:
```ts
import type { PortableTextBlock } from "@portabletext/react";
import type { SanityImageSource } from "@sanity/image-url/lib/types/types";

export type PricingPlan = { _id: string; name: string; price: string; cadence: string; bestFor?: string; featured?: boolean; features?: string[]; ctaLabel?: string };
export type Service = { _id: string; title: string; description?: string; icon?: string; category?: "managed" | "implementation" };
export type Comparison = { _id: string; optionLabel?: string; title?: string; body?: string; costNote?: string };
export type Stat = { _id: string; value: string; label: string };
export type Testimonial = { _id: string; quote?: string; name?: string; role?: string; company?: string; logo?: SanityImageSource };
export type ClientLogo = { _id: string; name?: string; logo?: SanityImageSource };
export type Faq = { _id: string; question: string; answer: string };
export type PostListItem = { _id: string; title: string; slug: string; excerpt?: string; coverImage?: SanityImageSource; publishedAt: string };
export type Post = PostListItem & { body?: PortableTextBlock[]; author?: { name: string; role?: string; avatar?: SanityImageSource }; seoDescription?: string };
export type JobListItem = { _id: string; title: string; slug: string; location?: string; employmentType?: string };
export type Job = JobListItem & { salaryRange?: string; applyUrl?: string; description?: PortableTextBlock[] };
export type LegalPage = { _id: string; title: string; slug: string; updatedAt?: string; body?: PortableTextBlock[] };
export type SiteSettings = { brandName: string; tagline?: string; contactEmail?: string; seoDescription?: string };
```

- [ ] **Step 2: Create queries**

`sanity/lib/queries.ts`:
```ts
export const PRICING_PLANS_QUERY = `*[_type == "pricingPlan"]|order(order asc){_id,name,price,cadence,bestFor,featured,features,ctaLabel}`;
export const SERVICES_QUERY = `*[_type == "service"]|order(order asc){_id,title,description,icon,category}`;
export const COMPARISONS_QUERY = `*[_type == "comparison"]|order(order asc){_id,optionLabel,title,body,costNote}`;
export const STATS_QUERY = `*[_type == "stat"]|order(order asc){_id,value,label}`;
export const TESTIMONIALS_QUERY = `*[_type == "testimonial"]{_id,quote,name,role,company,logo}`;
export const CLIENT_LOGOS_QUERY = `*[_type == "clientLogo"]|order(order asc){_id,name,logo}`;
export const FAQS_QUERY = `*[_type == "faq" && page == $page]|order(order asc){_id,question,answer}`;
export const POSTS_QUERY = `*[_type == "post"]|order(publishedAt desc){_id,title,"slug":slug.current,excerpt,coverImage,publishedAt}`;
export const POST_QUERY = `*[_type == "post" && slug.current == $slug][0]{_id,title,"slug":slug.current,excerpt,coverImage,publishedAt,body,seoDescription,author->{name,role,avatar}}`;
export const POST_SLUGS_QUERY = `*[_type == "post" && defined(slug.current)]{"slug":slug.current}`;
export const JOBS_QUERY = `*[_type == "job" && active == true]{_id,title,"slug":slug.current,location,employmentType}`;
export const JOB_QUERY = `*[_type == "job" && slug.current == $slug][0]{_id,title,"slug":slug.current,location,employmentType,salaryRange,applyUrl,description}`;
export const JOB_SLUGS_QUERY = `*[_type == "job" && defined(slug.current)]{"slug":slug.current}`;
export const LEGAL_QUERY = `*[_type == "legalPage" && slug.current == $slug][0]{_id,title,"slug":slug.current,updatedAt,body}`;
export const LEGAL_SLUGS_QUERY = `*[_type == "legalPage" && defined(slug.current)]{"slug":slug.current}`;
export const SITE_SETTINGS_QUERY = `*[_type == "siteSettings"][0]{brandName,tagline,contactEmail,seoDescription}`;
```

- [ ] **Step 3: Write the failing test**

`sanity/lib/fetch.test.ts`:
```ts
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.stubEnv("NEXT_PUBLIC_SANITY_PROJECT_ID", "testproj");
vi.stubEnv("NEXT_PUBLIC_SANITY_DATASET", "production");

const fetchMock = vi.fn();
vi.mock("./client", () => ({ client: { fetch: (...a: unknown[]) => fetchMock(...a) } }));

describe("sanityFetch", () => {
  beforeEach(() => fetchMock.mockReset());
  it("passes query and params to the client and returns data", async () => {
    fetchMock.mockResolvedValue([{ _id: "1" }]);
    const { sanityFetch } = await import("./fetch");
    const result = await sanityFetch<{ _id: string }[]>({ query: "Q", params: { slug: "x" }, tags: ["post"] });
    expect(result).toEqual([{ _id: "1" }]);
    expect(fetchMock).toHaveBeenCalledWith("Q", { slug: "x" }, expect.objectContaining({ next: { tags: ["post"] } }));
  });
});
```

- [ ] **Step 4: Run test to verify it fails**

Run: `cd Vertex-Project/suitevertex && npx vitest run sanity/lib/fetch.test.ts`
Expected: FAIL — cannot find `./fetch`.

- [ ] **Step 5: Implement sanityFetch**

`sanity/lib/fetch.ts`:
```ts
import { client } from "./client";

export async function sanityFetch<T>({ query, params = {}, tags }: { query: string; params?: Record<string, unknown>; tags: string[] }): Promise<T> {
  return client.fetch<T>(query, params, { next: { tags } });
}
```

- [ ] **Step 6: Run test to verify it passes**

Run: `cd Vertex-Project/suitevertex && npx vitest run sanity/lib/fetch.test.ts`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "feat(suitevertex): GROQ queries, content types, tagged fetch wrapper"
```

---

## Phase 4 — Home Page Sections

### Task 7: Hero, Stats, ServicesGrid sections

**Files:**
- Create: `Vertex-Project/suitevertex/components/sections/hero.tsx`
- Create: `Vertex-Project/suitevertex/components/sections/stats.tsx`
- Create: `Vertex-Project/suitevertex/components/sections/services-grid.tsx`
- Test: `Vertex-Project/suitevertex/components/sections/stats.test.tsx`

**Interfaces:**
- Consumes: `Stat`, `Service` types; `Container`, `ButtonLink`, `SectionHeading`, `Card`.
- Produces:
  - `<Hero />` — no props (static brand copy from `SITE`).
  - `<Stats items={Stat[]} />`.
  - `<ServicesGrid items={Service[]} />`.

- [ ] **Step 1: Write the failing test**

`components/sections/stats.test.tsx`:
```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Stats } from "./stats";

describe("Stats", () => {
  it("renders each stat value and label", () => {
    render(<Stats items={[{ _id: "1", value: "20+", label: "Years experience" }]} />);
    expect(screen.getByText("20+")).toBeInTheDocument();
    expect(screen.getByText("Years experience")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd Vertex-Project/suitevertex && npx vitest run components/sections/stats.test.tsx`
Expected: FAIL — cannot find `./stats`.

- [ ] **Step 3: Implement the three sections**

`components/sections/hero.tsx`:
```tsx
import { Container } from "@/components/ui/container";
import { ButtonLink } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SITE } from "@/content/site";

export function Hero() {
  return (
    <section className="bg-navy-950 text-white">
      <Container className="py-24 text-center">
        <Badge className="mb-6">For mid-market NetSuite teams</Badge>
        <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight sm:text-6xl">{SITE.tagline}</h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-white/70">
          Scripts, workflows, integrations, and the occasional fire — handled by senior engineers for one flat monthly fee. Plans start at $2,499/mo.
        </p>
        <div className="mt-10 flex justify-center gap-4">
          <ButtonLink href="/contact" size="lg">{SITE.cta.book}</ButtonLink>
          <ButtonLink href="/pricing" variant="outline" size="lg" className="border-white/20 text-white hover:bg-white/10">{SITE.cta.plans}</ButtonLink>
        </div>
      </Container>
    </section>
  );
}
```

`components/sections/stats.tsx`:
```tsx
import { Container } from "@/components/ui/container";
import type { Stat } from "@/sanity/lib/types";

export function Stats({ items }: { items: Stat[] }) {
  if (!items.length) return null;
  return (
    <section className="border-y border-navy-800/10 bg-white">
      <Container className="grid grid-cols-2 gap-8 py-12 md:grid-cols-4">
        {items.map((s) => (
          <div key={s._id} className="text-center">
            <p className="text-3xl font-bold text-indigo-600">{s.value}</p>
            <p className="mt-1 text-sm text-navy-800/60">{s.label}</p>
          </div>
        ))}
      </Container>
    </section>
  );
}
```

`components/sections/services-grid.tsx`:
```tsx
import { Container } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/ui/section-heading";
import type { Service } from "@/sanity/lib/types";

export function ServicesGrid({ items }: { items: Service[] }) {
  if (!items.length) return null;
  return (
    <section className="py-20">
      <Container>
        <SectionHeading eyebrow="What's included" title="One team, senior eyes on everything" subtitle="Everything your NetSuite operation needs, on a predictable monthly plan." />
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {items.map((s) => (
            <Card key={s._id}>
              <h3 className="text-lg font-semibold">{s.title}</h3>
              {s.description && <p className="mt-2 text-sm text-navy-800/70">{s.description}</p>}
            </Card>
          ))}
        </div>
      </Container>
    </section>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd Vertex-Project/suitevertex && npx vitest run components/sections/stats.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(suitevertex): hero, stats, services-grid sections"
```

### Task 8: PricingCards, Comparison, FAQ, CTA, SocialProof sections

**Files:**
- Create: `Vertex-Project/suitevertex/components/sections/pricing-cards.tsx`
- Create: `Vertex-Project/suitevertex/components/sections/comparison.tsx`
- Create: `Vertex-Project/suitevertex/components/sections/faq.tsx`
- Create: `Vertex-Project/suitevertex/components/sections/cta.tsx`
- Create: `Vertex-Project/suitevertex/components/sections/social-proof.tsx`
- Test: `Vertex-Project/suitevertex/components/sections/pricing-cards.test.tsx`

**Interfaces:**
- Consumes: `PricingPlan`, `Comparison`, `Faq`, `Testimonial` types; `Card`, `Badge`, `ButtonLink`, `Container`, `SectionHeading`.
- Produces:
  - `<PricingCards plans={PricingPlan[]} />` — featured plan highlighted.
  - `<Comparison items={Comparison[]} />`.
  - `<Faq items={Faq[]} />` — accordion (`'use client'`).
  - `<Cta />` — static closing call to action.
  - `<SocialProof items={Testimonial[]} />`.

- [ ] **Step 1: Write the failing test**

`components/sections/pricing-cards.test.tsx`:
```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { PricingCards } from "./pricing-cards";

const plans = [
  { _id: "1", name: "Starter", price: "$2,499", cadence: "/mo", features: ["A"] },
  { _id: "2", name: "Growth", price: "$3,999", cadence: "/mo", featured: true, features: ["B"] },
];

describe("PricingCards", () => {
  it("renders plan names and prices", () => {
    render(<PricingCards plans={plans} />);
    expect(screen.getByText("Starter")).toBeInTheDocument();
    expect(screen.getByText("$3,999")).toBeInTheDocument();
  });
  it("marks the featured plan", () => {
    render(<PricingCards plans={plans} />);
    expect(screen.getByText(/most popular/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd Vertex-Project/suitevertex && npx vitest run components/sections/pricing-cards.test.tsx`
Expected: FAIL — cannot find `./pricing-cards`.

- [ ] **Step 3: Implement the sections**

`components/sections/pricing-cards.tsx`:
```tsx
import { Container } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { Check } from "lucide-react";
import type { PricingPlan } from "@/sanity/lib/types";

export function PricingCards({ plans }: { plans: PricingPlan[] }) {
  if (!plans.length) return null;
  return (
    <section className="py-20" id="pricing">
      <Container className="grid gap-6 md:grid-cols-3">
        {plans.map((p) => (
          <Card key={p._id} className={cn(p.featured && "ring-2 ring-indigo-600")}>
            {p.featured && <Badge className="mb-4">Most popular</Badge>}
            <h3 className="text-xl font-semibold">{p.name}</h3>
            {p.bestFor && <p className="mt-1 text-sm text-navy-800/60">{p.bestFor}</p>}
            <p className="mt-4 text-4xl font-bold">{p.price}<span className="text-base font-normal text-navy-800/50">{p.cadence === "/mo" ? "/mo" : ""}</span></p>
            <ul className="mt-6 space-y-2 text-sm">
              {(p.features ?? []).map((f) => (
                <li key={f} className="flex gap-2"><Check className="size-4 shrink-0 text-teal-500" />{f}</li>
              ))}
            </ul>
            <ButtonLink href="/contact" className="mt-6 w-full" variant={p.featured ? "primary" : "outline"}>{p.ctaLabel ?? "Book intro call"}</ButtonLink>
          </Card>
        ))}
      </Container>
    </section>
  );
}
```

`components/sections/comparison.tsx`:
```tsx
import { Container } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/ui/section-heading";
import type { Comparison as ComparisonType } from "@/sanity/lib/types";

export function Comparison({ items }: { items: ComparisonType[] }) {
  if (!items.length) return null;
  return (
    <section className="bg-navy-950 py-20 text-white">
      <Container>
        <SectionHeading eyebrow="The alternatives" title="How most teams handle this today" subtitle="The usual options are expensive, slow, or risky." />
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {items.map((c) => (
            <Card key={c._id} className="border-white/10 bg-navy-900 text-white">
              <p className="text-sm font-medium text-teal-400">{c.optionLabel}</p>
              <h3 className="mt-2 text-lg font-semibold">{c.title}</h3>
              {c.body && <p className="mt-2 text-sm text-white/60">{c.body}</p>}
              {c.costNote && <p className="mt-4 text-sm font-medium">{c.costNote}</p>}
            </Card>
          ))}
        </div>
      </Container>
    </section>
  );
}
```

`components/sections/faq.tsx`:
```tsx
"use client";
import { useState } from "react";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";
import type { Faq as FaqType } from "@/sanity/lib/types";

export function Faq({ items }: { items: FaqType[] }) {
  const [open, setOpen] = useState<string | null>(null);
  if (!items.length) return null;
  return (
    <section className="py-20">
      <Container className="max-w-3xl">
        <SectionHeading title="Questions, answered" />
        <div className="mt-10 divide-y divide-navy-800/10">
          {items.map((f) => (
            <div key={f._id} className="py-4">
              <button onClick={() => setOpen(open === f._id ? null : f._id)} className="flex w-full items-center justify-between text-left font-medium" aria-expanded={open === f._id}>
                {f.question}
                <ChevronDown className={cn("size-5 transition-transform", open === f._id && "rotate-180")} />
              </button>
              {open === f._id && <p className="mt-3 text-sm text-navy-800/70">{f.answer}</p>}
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
```

`components/sections/cta.tsx`:
```tsx
import { Container } from "@/components/ui/container";
import { ButtonLink } from "@/components/ui/button";
import { SITE } from "@/content/site";

export function Cta() {
  return (
    <section className="bg-indigo-600 py-20 text-white">
      <Container className="text-center">
        <h2 className="text-3xl font-bold sm:text-4xl">Stop dealing with hourly invoices.</h2>
        <p className="mx-auto mt-4 max-w-xl text-lg text-white/80">One team, predictable monthly fee, senior eyes on everything. Book a 15-minute intro call.</p>
        <ButtonLink href="/contact" size="lg" variant="outline" className="mt-8 border-white bg-white text-indigo-600 hover:bg-white/90">{SITE.cta.book}</ButtonLink>
      </Container>
    </section>
  );
}
```

`components/sections/social-proof.tsx`:
```tsx
import { Container } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import type { Testimonial } from "@/sanity/lib/types";

export function SocialProof({ items }: { items: Testimonial[] }) {
  if (!items.length) return null;
  return (
    <section className="bg-white py-20">
      <Container className="grid gap-6 md:grid-cols-2">
        {items.map((t) => (
          <Card key={t._id}>
            <p className="text-lg">“{t.quote}”</p>
            <p className="mt-4 text-sm font-medium">{t.name}{t.role ? `, ${t.role}` : ""}{t.company ? ` · ${t.company}` : ""}</p>
          </Card>
        ))}
      </Container>
    </section>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd Vertex-Project/suitevertex && npx vitest run components/sections/pricing-cards.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(suitevertex): pricing, comparison, faq, cta, social-proof sections"
```

### Task 9: Assemble the Home page

**Files:**
- Modify: `Vertex-Project/suitevertex/app/(marketing)/page.tsx`

**Interfaces:**
- Consumes: all section components; `sanityFetch`; queries.
- Produces: a complete Server Component home page.

- [ ] **Step 1: Implement the home page**

`app/(marketing)/page.tsx`:
```tsx
import { Hero } from "@/components/sections/hero";
import { Stats } from "@/components/sections/stats";
import { PricingCards } from "@/components/sections/pricing-cards";
import { Comparison } from "@/components/sections/comparison";
import { ServicesGrid } from "@/components/sections/services-grid";
import { SocialProof } from "@/components/sections/social-proof";
import { Faq } from "@/components/sections/faq";
import { Cta } from "@/components/sections/cta";
import { sanityFetch } from "@/sanity/lib/fetch";
import * as Q from "@/sanity/lib/queries";
import type { Stat, PricingPlan, Comparison as C, Service, Testimonial, Faq as F } from "@/sanity/lib/types";

export default async function HomePage() {
  const [stats, plans, comparisons, services, testimonials, faqs] = await Promise.all([
    sanityFetch<Stat[]>({ query: Q.STATS_QUERY, tags: ["stat"] }),
    sanityFetch<PricingPlan[]>({ query: Q.PRICING_PLANS_QUERY, tags: ["pricingPlan"] }),
    sanityFetch<C[]>({ query: Q.COMPARISONS_QUERY, tags: ["comparison"] }),
    sanityFetch<Service[]>({ query: Q.SERVICES_QUERY, tags: ["service"] }),
    sanityFetch<Testimonial[]>({ query: Q.TESTIMONIALS_QUERY, tags: ["testimonial"] }),
    sanityFetch<F[]>({ query: Q.FAQS_QUERY, params: { page: "home" }, tags: ["faq"] }),
  ]);
  return (
    <main>
      <Hero />
      <Stats items={stats} />
      <PricingCards plans={plans} />
      <Comparison items={comparisons} />
      <ServicesGrid items={services} />
      <SocialProof items={testimonials} />
      <Faq items={faqs} />
      <Cta />
    </main>
  );
}
```

- [ ] **Step 2: Verify it typechecks/builds**

Run: `cd Vertex-Project/suitevertex && npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "feat(suitevertex): assemble home page from CMS-driven sections"
```

---

## Phase 5 — Inner Marketing Pages

### Task 10: Pricing page

**Files:**
- Create: `Vertex-Project/suitevertex/app/(marketing)/pricing/page.tsx`

**Interfaces:**
- Consumes: `PricingCards`, `Faq`, `sanityFetch`, queries.

- [ ] **Step 1: Implement the pricing page**

`app/(marketing)/pricing/page.tsx`:
```tsx
import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { PricingCards } from "@/components/sections/pricing-cards";
import { Faq } from "@/components/sections/faq";
import { sanityFetch } from "@/sanity/lib/fetch";
import * as Q from "@/sanity/lib/queries";
import type { PricingPlan, Faq as F } from "@/sanity/lib/types";

export const metadata: Metadata = { title: "Pricing", description: "Flat monthly NetSuite plans from $2,499. No commitment, cancel anytime." };

export default async function PricingPage() {
  const [plans, faqs] = await Promise.all([
    sanityFetch<PricingPlan[]>({ query: Q.PRICING_PLANS_QUERY, tags: ["pricingPlan"] }),
    sanityFetch<F[]>({ query: Q.FAQS_QUERY, params: { page: "pricing" }, tags: ["faq"] }),
  ]);
  return (
    <main>
      <Container className="py-20 text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Pay monthly. No commitment.</h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-navy-800/70">Three plans for growing NetSuite teams. Just need one project? Implementation sprints run flat at $4,999.</p>
      </Container>
      <PricingCards plans={plans} />
      <Faq items={faqs} />
    </main>
  );
}
```

- [ ] **Step 2: Build check**

Run: `cd Vertex-Project/suitevertex && npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "feat(suitevertex): pricing page"
```

### Task 11: How it Works + About pages

**Files:**
- Create: `Vertex-Project/suitevertex/app/(marketing)/how-it-works/page.tsx`
- Create: `Vertex-Project/suitevertex/app/(marketing)/about/page.tsx`

**Interfaces:**
- Consumes: `Container`, `SectionHeading`, `Stats`, `sanityFetch`, `STATS_QUERY`.

- [ ] **Step 1: Implement How it Works**

`app/(marketing)/how-it-works/page.tsx`:
```tsx
import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { Cta } from "@/components/sections/cta";

export const metadata: Metadata = { title: "How it works", description: "How SuiteVertex's monthly NetSuite plans work — onboarding, requests, and response times." };

const STEPS = [
  { n: "01", title: "Book an intro call", body: "A 15-minute call to understand your NetSuite setup and what you need handled." },
  { n: "02", title: "Pick a plan, onboard in days", body: "We map your account, integrations, and priorities. No six-month ramp." },
  { n: "03", title: "Submit requests, any channel", body: "Email or shared channel. Scripts, workflows, integrations, fixes — one queue." },
  { n: "04", title: "Senior eyes, < 1 business day", body: "Typical response under one business day. Everything reviewed by senior engineers." },
  { n: "05", title: "Predictable monthly invoice", body: "One flat fee. No change orders, no scope-creep theatre. Cancel anytime." },
];

export default function HowItWorksPage() {
  return (
    <main>
      <Container className="py-20">
        <SectionHeading eyebrow="How it works" title="NetSuite work, without the hourly surprises" />
        <div className="mt-12 space-y-8">
          {STEPS.map((s) => (
            <div key={s.n} className="flex gap-6">
              <span className="text-2xl font-bold text-indigo-600">{s.n}</span>
              <div>
                <h3 className="text-lg font-semibold">{s.title}</h3>
                <p className="mt-1 text-navy-800/70">{s.body}</p>
              </div>
            </div>
          ))}
        </div>
      </Container>
      <Cta />
    </main>
  );
}
```

- [ ] **Step 2: Implement About**

`app/(marketing)/about/page.tsx`:
```tsx
import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { Stats } from "@/components/sections/stats";
import { Cta } from "@/components/sections/cta";
import { sanityFetch } from "@/sanity/lib/fetch";
import * as Q from "@/sanity/lib/queries";
import type { Stat } from "@/sanity/lib/types";

export const metadata: Metadata = { title: "About", description: "SuiteVertex is a team of senior NetSuite engineers serving US mid-market finance and operations teams." };

export default async function AboutPage() {
  const stats = await sanityFetch<Stat[]>({ query: Q.STATS_QUERY, tags: ["stat"] });
  return (
    <main>
      <Container className="py-20 max-w-3xl">
        <SectionHeading align="left" eyebrow="About" title="We built the monthly plan we wished existed" />
        <div className="mt-6 space-y-4 text-lg text-navy-800/70">
          <p>Every NetSuite buyer we talked to asked the same thing: can we just pay you monthly and stop dealing with hourly invoices? SuiteVertex is our answer.</p>
          <p>We are senior NetSuite engineers focused on US mid-market finance and operations teams — the work managed, not nickel-and-dimed.</p>
        </div>
      </Container>
      <Stats items={stats} />
      <Cta />
    </main>
  );
}
```

- [ ] **Step 3: Build check**

Run: `cd Vertex-Project/suitevertex && npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat(suitevertex): how-it-works and about pages"
```

---

## Phase 6 — Contact → Vertex CRM

### Task 12: CRM client + contact API route

**Files:**
- Create: `Vertex-Project/suitevertex/lib/crm.ts`
- Create: `Vertex-Project/suitevertex/app/api/contact/route.ts`
- Test: `Vertex-Project/suitevertex/lib/crm.test.ts`

**Interfaces:**
- Produces:
  - `ContactInput = { name: string; email: string; company?: string; message: string; plan?: string }`.
  - `submitLead(input: ContactInput): Promise<{ ok: true } | { ok: false; error: string }>` — posts to `VERTEX_CRM_URL` with bearer `VERTEX_CRM_API_KEY`, body `{ source: "suitevertex", name, email, company, message, planInterest }`.
  - `validateContact(data: unknown): { ok: true; value: ContactInput } | { ok: false; error: string }`.

> Open item from spec §7/§12: confirm the exact Vertex CRM endpoint path, auth header, and payload. This task assumes `POST {VERTEX_CRM_URL}` with `Authorization: Bearer {key}` and JSON body. Adjust `submitLead` to match the real contract during implementation; the test mocks `fetch`, so the shape is asserted explicitly and easy to update.

- [ ] **Step 1: Write the failing test**

`lib/crm.test.ts`:
```ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { validateContact, submitLead } from "./crm";

describe("validateContact", () => {
  it("rejects missing email", () => {
    const r = validateContact({ name: "A", message: "hi" });
    expect(r.ok).toBe(false);
  });
  it("accepts valid input", () => {
    const r = validateContact({ name: "A", email: "a@b.com", message: "hi" });
    expect(r.ok).toBe(true);
  });
});

describe("submitLead", () => {
  beforeEach(() => {
    vi.stubEnv("VERTEX_CRM_URL", "https://crm.example/leads");
    vi.stubEnv("VERTEX_CRM_API_KEY", "secret");
  });
  it("posts the lead with auth header and source", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchMock);
    const r = await submitLead({ name: "A", email: "a@b.com", message: "hi", company: "Acme" });
    expect(r.ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledWith("https://crm.example/leads", expect.objectContaining({
      method: "POST",
      headers: expect.objectContaining({ Authorization: "Bearer secret", "Content-Type": "application/json" }),
    }));
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body).toMatchObject({ source: "suitevertex", name: "A", email: "a@b.com", company: "Acme" });
  });
  it("returns error when CRM responds non-ok", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 500 }));
    const r = await submitLead({ name: "A", email: "a@b.com", message: "hi" });
    expect(r.ok).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd Vertex-Project/suitevertex && npx vitest run lib/crm.test.ts`
Expected: FAIL — cannot find `./crm`.

- [ ] **Step 3: Implement crm.ts**

`lib/crm.ts`:
```ts
export type ContactInput = { name: string; email: string; company?: string; message: string; plan?: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateContact(data: unknown): { ok: true; value: ContactInput } | { ok: false; error: string } {
  if (typeof data !== "object" || data === null) return { ok: false, error: "Invalid payload" };
  const d = data as Record<string, unknown>;
  const name = typeof d.name === "string" ? d.name.trim() : "";
  const email = typeof d.email === "string" ? d.email.trim() : "";
  const message = typeof d.message === "string" ? d.message.trim() : "";
  if (!name) return { ok: false, error: "Name is required" };
  if (!EMAIL_RE.test(email)) return { ok: false, error: "Valid email is required" };
  if (!message) return { ok: false, error: "Message is required" };
  return {
    ok: true,
    value: { name, email, message, company: typeof d.company === "string" ? d.company.trim() : undefined, plan: typeof d.plan === "string" ? d.plan : undefined },
  };
}

export async function submitLead(input: ContactInput): Promise<{ ok: true } | { ok: false; error: string }> {
  const url = process.env.VERTEX_CRM_URL;
  const key = process.env.VERTEX_CRM_API_KEY;
  if (!url || !key) return { ok: false, error: "CRM not configured" };
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({ source: "suitevertex", name: input.name, email: input.email, company: input.company, message: input.message, planInterest: input.plan }),
    });
    if (!res.ok) return { ok: false, error: `CRM responded ${res.status}` };
    return { ok: true };
  } catch {
    return { ok: false, error: "Network error reaching CRM" };
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd Vertex-Project/suitevertex && npx vitest run lib/crm.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Implement the API route**

`app/api/contact/route.ts`:
```ts
import { NextResponse } from "next/server";
import { validateContact, submitLead } from "@/lib/crm";

export async function POST(request: Request) {
  let json: unknown;
  try { json = await request.json(); } catch { return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 }); }
  // Honeypot: bots fill hidden "website" field.
  if (json && typeof json === "object" && (json as Record<string, unknown>).website) {
    return NextResponse.json({ ok: true });
  }
  const parsed = validateContact(json);
  if (!parsed.ok) return NextResponse.json({ ok: false, error: parsed.error }, { status: 400 });
  const result = await submitLead(parsed.value);
  if (!result.ok) return NextResponse.json({ ok: false, error: result.error }, { status: 502 });
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat(suitevertex): contact validation, CRM lead submission, contact API"
```

### Task 13: Contact page + form

**Files:**
- Create: `Vertex-Project/suitevertex/components/contact-form.tsx`
- Create: `Vertex-Project/suitevertex/app/(marketing)/contact/page.tsx`
- Test: `Vertex-Project/suitevertex/components/contact-form.test.tsx`

**Interfaces:**
- Consumes: `Button`, `Container`, `SITE`; posts to `/api/contact`.
- Produces: `<ContactForm />` (`'use client'`) with success/error states.

- [ ] **Step 1: Write the failing test**

`components/contact-form.test.tsx`:
```tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ContactForm } from "./contact-form";

describe("ContactForm", () => {
  beforeEach(() => vi.restoreAllMocks());
  it("shows a success message after a successful submit", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true }) }));
    render(<ContactForm />);
    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: "Ada" } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "ada@x.com" } });
    fireEvent.change(screen.getByLabelText(/message/i), { target: { value: "Hi" } });
    fireEvent.click(screen.getByRole("button", { name: /send/i }));
    await waitFor(() => expect(screen.getByText(/thanks/i)).toBeInTheDocument());
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd Vertex-Project/suitevertex && npx vitest run components/contact-form.test.tsx`
Expected: FAIL — cannot find `./contact-form`.

- [ ] **Step 3: Implement the form**

`components/contact-form.tsx`:
```tsx
"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";

type Status = "idle" | "sending" | "success" | "error";

export function ContactForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sending");
    setError("");
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    try {
      const res = await fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      const body = await res.json();
      if (res.ok && body.ok) { setStatus("success"); form.reset(); }
      else { setStatus("error"); setError(body.error ?? "Something went wrong"); }
    } catch { setStatus("error"); setError("Network error"); }
  }

  if (status === "success") {
    return <p className="rounded-xl bg-teal-500/10 p-6 text-teal-700">Thanks — we’ll be in touch within one business day.</p>;
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
      <div>
        <label htmlFor="name" className="block text-sm font-medium">Name</label>
        <input id="name" name="name" required className="mt-1 w-full rounded-lg border border-navy-800/20 px-3 py-2" />
      </div>
      <div>
        <label htmlFor="email" className="block text-sm font-medium">Email</label>
        <input id="email" name="email" type="email" required className="mt-1 w-full rounded-lg border border-navy-800/20 px-3 py-2" />
      </div>
      <div>
        <label htmlFor="company" className="block text-sm font-medium">Company</label>
        <input id="company" name="company" className="mt-1 w-full rounded-lg border border-navy-800/20 px-3 py-2" />
      </div>
      <div>
        <label htmlFor="message" className="block text-sm font-medium">Message</label>
        <textarea id="message" name="message" required rows={4} className="mt-1 w-full rounded-lg border border-navy-800/20 px-3 py-2" />
      </div>
      {status === "error" && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" disabled={status === "sending"} className="w-full">{status === "sending" ? "Sending…" : "Send message"}</Button>
    </form>
  );
}
```

- [ ] **Step 4: Implement the contact page**

`app/(marketing)/contact/page.tsx`:
```tsx
import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { ContactForm } from "@/components/contact-form";
import { SITE } from "@/content/site";

export const metadata: Metadata = { title: "Contact", description: "Book a 15-minute intro call with SuiteVertex." };

export default function ContactPage() {
  return (
    <main>
      <Container className="grid gap-12 py-20 md:grid-cols-2">
        <div>
          <SectionHeading align="left" eyebrow="Contact" title="Book a 15-minute intro call" subtitle="Tell us about your NetSuite setup. We respond within one business day." />
          <p className="mt-6 text-navy-800/70">Prefer email? <a href={`mailto:${SITE.email}`} className="text-indigo-600 underline">{SITE.email}</a></p>
        </div>
        <ContactForm />
      </Container>
    </main>
  );
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `cd Vertex-Project/suitevertex && npx vitest run components/contact-form.test.tsx`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat(suitevertex): contact page with CRM-backed form"
```

---

## Phase 7 — Blog, Careers, Legal (Portable Text)

### Task 14: Portable Text renderer

**Files:**
- Create: `Vertex-Project/suitevertex/components/portable-text.tsx`
- Test: `Vertex-Project/suitevertex/components/portable-text.test.tsx`

**Interfaces:**
- Consumes: `@portabletext/react`, `urlFor`.
- Produces: `<RichText value={PortableTextBlock[]} />`.

- [ ] **Step 1: Write the failing test**

`components/portable-text.test.tsx`:
```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { RichText } from "./portable-text";

const blocks = [{ _type: "block", _key: "a", style: "normal", children: [{ _type: "span", _key: "s", text: "Hello world", marks: [] }], markDefs: [] }];

describe("RichText", () => {
  it("renders block text", () => {
    render(<RichText value={blocks} />);
    expect(screen.getByText("Hello world")).toBeInTheDocument();
  });
  it("renders nothing for empty value", () => {
    const { container } = render(<RichText value={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd Vertex-Project/suitevertex && npx vitest run components/portable-text.test.tsx`
Expected: FAIL — cannot find `./portable-text`.

- [ ] **Step 3: Implement RichText**

`components/portable-text.tsx`:
```tsx
import { PortableText, type PortableTextComponents, type PortableTextBlock } from "@portabletext/react";
import Image from "next/image";
import { urlFor } from "@/sanity/lib/image";

const components: PortableTextComponents = {
  block: {
    h2: ({ children }) => <h2 className="mt-10 text-2xl font-bold">{children}</h2>,
    h3: ({ children }) => <h3 className="mt-8 text-xl font-semibold">{children}</h3>,
    normal: ({ children }) => <p className="mt-4 leading-relaxed text-navy-800/80">{children}</p>,
  },
  list: { bullet: ({ children }) => <ul className="mt-4 list-disc space-y-1 pl-6">{children}</ul> },
  marks: { link: ({ children, value }) => <a href={value?.href} className="text-indigo-600 underline">{children}</a> },
  types: {
    image: ({ value }) => <Image src={urlFor(value).width(1200).url()} alt={value?.alt ?? ""} width={1200} height={675} className="mt-6 rounded-xl" />,
  },
};

export function RichText({ value }: { value: PortableTextBlock[] }) {
  if (!value?.length) return null;
  return <div><PortableText value={value} components={components} /></div>;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd Vertex-Project/suitevertex && npx vitest run components/portable-text.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(suitevertex): portable text renderer"
```

### Task 15: Blog index + post pages

**Files:**
- Create: `Vertex-Project/suitevertex/app/blog/page.tsx`
- Create: `Vertex-Project/suitevertex/app/blog/[slug]/page.tsx`
- Create: `Vertex-Project/suitevertex/app/blog/layout.tsx`

**Interfaces:**
- Consumes: `sanityFetch`, `POSTS_QUERY`, `POST_QUERY`, `POST_SLUGS_QUERY`, `RichText`, `Navbar`/`Footer` via layout.

- [ ] **Step 1: Add a shared layout for non-marketing routes**

`app/blog/layout.tsx`:
```tsx
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return <><Navbar />{children}<Footer /></>;
}
```

- [ ] **Step 2: Implement blog index**

`app/blog/page.tsx`:
```tsx
import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { sanityFetch } from "@/sanity/lib/fetch";
import { POSTS_QUERY } from "@/sanity/lib/queries";
import type { PostListItem } from "@/sanity/lib/types";

export const metadata: Metadata = { title: "Blog", description: "NetSuite insights from the SuiteVertex team." };

export default async function BlogPage() {
  const posts = await sanityFetch<PostListItem[]>({ query: POSTS_QUERY, tags: ["post"] });
  return (
    <main>
      <Container className="py-20">
        <SectionHeading align="left" eyebrow="Blog" title="NetSuite, in practice" />
        <div className="mt-12 grid gap-8 md:grid-cols-2">
          {posts.map((p) => (
            <Link key={p._id} href={`/blog/${p.slug}`} className="group">
              <h2 className="text-xl font-semibold group-hover:text-indigo-600">{p.title}</h2>
              {p.excerpt && <p className="mt-2 text-navy-800/70">{p.excerpt}</p>}
              <p className="mt-2 text-sm text-navy-800/50">{new Date(p.publishedAt).toLocaleDateString()}</p>
            </Link>
          ))}
          {posts.length === 0 && <p className="text-navy-800/60">No posts yet.</p>}
        </div>
      </Container>
    </main>
  );
}
```

- [ ] **Step 3: Implement blog post page**

`app/blog/[slug]/page.tsx`:
```tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/container";
import { RichText } from "@/components/portable-text";
import { sanityFetch } from "@/sanity/lib/fetch";
import { POST_QUERY, POST_SLUGS_QUERY } from "@/sanity/lib/queries";
import type { Post } from "@/sanity/lib/types";

export async function generateStaticParams() {
  const slugs = await sanityFetch<{ slug: string }[]>({ query: POST_SLUGS_QUERY, tags: ["post"] });
  return slugs.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await sanityFetch<Post | null>({ query: POST_QUERY, params: { slug }, tags: ["post"] });
  if (!post) return {};
  return { title: post.title, description: post.seoDescription ?? post.excerpt };
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await sanityFetch<Post | null>({ query: POST_QUERY, params: { slug }, tags: ["post"] });
  if (!post) notFound();
  return (
    <main>
      <Container className="max-w-2xl py-20">
        <h1 className="text-4xl font-bold tracking-tight">{post.title}</h1>
        <p className="mt-3 text-sm text-navy-800/50">{new Date(post.publishedAt).toLocaleDateString()}{post.author ? ` · ${post.author.name}` : ""}</p>
        <article className="mt-8"><RichText value={post.body ?? []} /></article>
      </Container>
    </main>
  );
}
```

- [ ] **Step 4: Build check**

Run: `cd Vertex-Project/suitevertex && npx tsc --noEmit`
Expected: no errors.

> Note: `params` is a Promise in Next.js 16 — confirm against `node_modules/next/dist/docs/` and await it as shown.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(suitevertex): blog index and post pages"
```

### Task 16: Careers index + job pages

**Files:**
- Create: `Vertex-Project/suitevertex/app/careers/page.tsx`
- Create: `Vertex-Project/suitevertex/app/careers/[slug]/page.tsx`
- Create: `Vertex-Project/suitevertex/app/careers/layout.tsx`

**Interfaces:**
- Consumes: `sanityFetch`, `JOBS_QUERY`, `JOB_QUERY`, `JOB_SLUGS_QUERY`, `RichText`, `ButtonLink`.

- [ ] **Step 1: Add careers layout**

`app/careers/layout.tsx`:
```tsx
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
export default function CareersLayout({ children }: { children: React.ReactNode }) {
  return <><Navbar />{children}<Footer /></>;
}
```

- [ ] **Step 2: Implement careers index**

`app/careers/page.tsx`:
```tsx
import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { Card } from "@/components/ui/card";
import { sanityFetch } from "@/sanity/lib/fetch";
import { JOBS_QUERY } from "@/sanity/lib/queries";
import type { JobListItem } from "@/sanity/lib/types";

export const metadata: Metadata = { title: "Careers", description: "Join SuiteVertex — senior NetSuite engineers and operators." };

export default async function CareersPage() {
  const jobs = await sanityFetch<JobListItem[]>({ query: JOBS_QUERY, tags: ["job"] });
  return (
    <main>
      <Container className="py-20">
        <SectionHeading align="left" eyebrow="Careers" title="Work with senior NetSuite people" />
        <div className="mt-12 space-y-4">
          {jobs.map((j) => (
            <Link key={j._id} href={`/careers/${j.slug}`}>
              <Card className="flex items-center justify-between transition-colors hover:border-indigo-600">
                <div>
                  <h2 className="text-lg font-semibold">{j.title}</h2>
                  <p className="mt-1 text-sm text-navy-800/60">{[j.location, j.employmentType].filter(Boolean).join(" · ")}</p>
                </div>
                <span className="text-indigo-600">→</span>
              </Card>
            </Link>
          ))}
          {jobs.length === 0 && <p className="text-navy-800/60">No open roles right now.</p>}
        </div>
      </Container>
    </main>
  );
}
```

- [ ] **Step 3: Implement job detail page**

`app/careers/[slug]/page.tsx`:
```tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/container";
import { ButtonLink } from "@/components/ui/button";
import { RichText } from "@/components/portable-text";
import { sanityFetch } from "@/sanity/lib/fetch";
import { JOB_QUERY, JOB_SLUGS_QUERY } from "@/sanity/lib/queries";
import type { Job } from "@/sanity/lib/types";

export async function generateStaticParams() {
  const slugs = await sanityFetch<{ slug: string }[]>({ query: JOB_SLUGS_QUERY, tags: ["job"] });
  return slugs.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const job = await sanityFetch<Job | null>({ query: JOB_QUERY, params: { slug }, tags: ["job"] });
  return job ? { title: job.title } : {};
}

export default async function JobPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const job = await sanityFetch<Job | null>({ query: JOB_QUERY, params: { slug }, tags: ["job"] });
  if (!job) notFound();
  return (
    <main>
      <Container className="max-w-2xl py-20">
        <h1 className="text-4xl font-bold tracking-tight">{job.title}</h1>
        <p className="mt-3 text-navy-800/60">{[job.location, job.employmentType, job.salaryRange].filter(Boolean).join(" · ")}</p>
        <article className="mt-8"><RichText value={job.description ?? []} /></article>
        {job.applyUrl && <ButtonLink href={job.applyUrl} className="mt-8">Apply now</ButtonLink>}
      </Container>
    </main>
  );
}
```

- [ ] **Step 4: Build check**

Run: `cd Vertex-Project/suitevertex && npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(suitevertex): careers index and job detail pages"
```

### Task 17: Legal pages

**Files:**
- Create: `Vertex-Project/suitevertex/app/legal/[slug]/page.tsx`
- Create: `Vertex-Project/suitevertex/app/legal/layout.tsx`

**Interfaces:**
- Consumes: `sanityFetch`, `LEGAL_QUERY`, `LEGAL_SLUGS_QUERY`, `RichText`.

- [ ] **Step 1: Add legal layout**

`app/legal/layout.tsx`:
```tsx
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return <><Navbar />{children}<Footer /></>;
}
```

- [ ] **Step 2: Implement legal page**

`app/legal/[slug]/page.tsx`:
```tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/container";
import { RichText } from "@/components/portable-text";
import { sanityFetch } from "@/sanity/lib/fetch";
import { LEGAL_QUERY, LEGAL_SLUGS_QUERY } from "@/sanity/lib/queries";
import type { LegalPage } from "@/sanity/lib/types";

export async function generateStaticParams() {
  const slugs = await sanityFetch<{ slug: string }[]>({ query: LEGAL_SLUGS_QUERY, tags: ["legalPage"] });
  return slugs.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const page = await sanityFetch<LegalPage | null>({ query: LEGAL_QUERY, params: { slug }, tags: ["legalPage"] });
  return page ? { title: page.title } : {};
}

export default async function LegalPageRoute({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = await sanityFetch<LegalPage | null>({ query: LEGAL_QUERY, params: { slug }, tags: ["legalPage"] });
  if (!page) notFound();
  return (
    <main>
      <Container className="max-w-2xl py-20">
        <h1 className="text-4xl font-bold tracking-tight">{page.title}</h1>
        {page.updatedAt && <p className="mt-2 text-sm text-navy-800/50">Updated {new Date(page.updatedAt).toLocaleDateString()}</p>}
        <article className="mt-8"><RichText value={page.body ?? []} /></article>
      </Container>
    </main>
  );
}
```

- [ ] **Step 3: Build check**

Run: `cd Vertex-Project/suitevertex && npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat(suitevertex): dynamic legal pages"
```

---

## Phase 8 — SEO, Revalidation & Final Verification

### Task 18: sitemap, robots, JSON-LD, revalidate webhook

**Files:**
- Create: `Vertex-Project/suitevertex/app/sitemap.ts`
- Create: `Vertex-Project/suitevertex/app/robots.ts`
- Create: `Vertex-Project/suitevertex/app/api/revalidate/route.ts`
- Modify: `Vertex-Project/suitevertex/app/layout.tsx`
- Test: `Vertex-Project/suitevertex/app/api/revalidate/revalidate.test.ts`

**Interfaces:**
- Consumes: `sanityFetch`, slug queries, `revalidateTag` from `next/cache`.
- Produces: `/api/revalidate` POST that verifies `?secret=` against `SANITY_REVALIDATE_SECRET` and calls `revalidateTag(body._type)`.

- [ ] **Step 1: Implement sitemap and robots**

`app/sitemap.ts`:
```ts
import type { MetadataRoute } from "next";
import { sanityFetch } from "@/sanity/lib/fetch";
import { POST_SLUGS_QUERY, JOB_SLUGS_QUERY, LEGAL_SLUGS_QUERY } from "@/sanity/lib/queries";

const BASE = "https://suitevertex.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [posts, jobs, legal] = await Promise.all([
    sanityFetch<{ slug: string }[]>({ query: POST_SLUGS_QUERY, tags: ["post"] }),
    sanityFetch<{ slug: string }[]>({ query: JOB_SLUGS_QUERY, tags: ["job"] }),
    sanityFetch<{ slug: string }[]>({ query: LEGAL_SLUGS_QUERY, tags: ["legalPage"] }),
  ]);
  const staticPaths = ["", "/pricing", "/how-it-works", "/about", "/contact", "/blog", "/careers"];
  return [
    ...staticPaths.map((p) => ({ url: `${BASE}${p}`, lastModified: new Date() })),
    ...posts.map((p) => ({ url: `${BASE}/blog/${p.slug}` })),
    ...jobs.map((j) => ({ url: `${BASE}/careers/${j.slug}` })),
    ...legal.map((l) => ({ url: `${BASE}/legal/${l.slug}` })),
  ];
}
```

`app/robots.ts`:
```ts
import type { MetadataRoute } from "next";
export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: "*", allow: "/", disallow: "/studio" }, sitemap: "https://suitevertex.com/sitemap.xml" };
}
```

- [ ] **Step 2: Add JSON-LD to root layout**

In `app/layout.tsx`, add inside `<body>` before `{children}`:
```tsx
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{ __html: JSON.stringify({
    "@context": "https://schema.org", "@type": "Organization",
    name: "SuiteVertex", url: "https://suitevertex.com",
    description: "Managed NetSuite development and implementation for US mid-market teams.",
  }) }}
/>
```

- [ ] **Step 3: Write the failing test for revalidate**

`app/api/revalidate/revalidate.test.ts`:
```ts
import { describe, it, expect, vi, beforeEach } from "vitest";

const revalidateTag = vi.fn();
vi.mock("next/cache", () => ({ revalidateTag: (t: string) => revalidateTag(t) }));
vi.mock("next/server", () => ({ NextResponse: { json: (b: unknown, i?: unknown) => ({ body: b, init: i }) } }));

describe("revalidate route", () => {
  beforeEach(() => { revalidateTag.mockReset(); vi.stubEnv("SANITY_REVALIDATE_SECRET", "shh"); });

  it("rejects a bad secret", async () => {
    const { POST } = await import("./route");
    const req = new Request("http://x/api/revalidate?secret=wrong", { method: "POST", body: JSON.stringify({ _type: "post" }) });
    const res = await POST(req);
    expect(res.init?.status).toBe(401);
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  it("revalidates the document type tag on valid secret", async () => {
    const { POST } = await import("./route");
    const req = new Request("http://x/api/revalidate?secret=shh", { method: "POST", body: JSON.stringify({ _type: "post" }) });
    await POST(req);
    expect(revalidateTag).toHaveBeenCalledWith("post");
  });
});
```

- [ ] **Step 4: Run test to verify it fails**

Run: `cd Vertex-Project/suitevertex && npx vitest run app/api/revalidate/revalidate.test.ts`
Expected: FAIL — cannot find `./route`.

- [ ] **Step 5: Implement the revalidate route**

`app/api/revalidate/route.ts`:
```ts
import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";

export async function POST(request: Request) {
  const secret = new URL(request.url).searchParams.get("secret");
  if (secret !== process.env.SANITY_REVALIDATE_SECRET) {
    return NextResponse.json({ ok: false, error: "Invalid secret" }, { status: 401 });
  }
  let body: { _type?: string };
  try { body = await request.json(); } catch { return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 }); }
  if (!body._type) return NextResponse.json({ ok: false, error: "Missing _type" }, { status: 400 });
  revalidateTag(body._type);
  return NextResponse.json({ ok: true, revalidated: body._type });
}
```

- [ ] **Step 6: Run test to verify it passes**

Run: `cd Vertex-Project/suitevertex && npx vitest run app/api/revalidate/revalidate.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "feat(suitevertex): sitemap, robots, json-ld, sanity revalidate webhook"
```

### Task 19: Full test suite, build, lint, and README

**Files:**
- Create: `Vertex-Project/suitevertex/README.md`

**Interfaces:** none.

- [ ] **Step 1: Run the full test suite**

Run: `cd Vertex-Project/suitevertex && npx vitest run`
Expected: all test files PASS.

- [ ] **Step 2: Typecheck and lint**

Run: `cd Vertex-Project/suitevertex && npx tsc --noEmit && npm run lint`
Expected: no errors.

- [ ] **Step 3: Production build (with dummy env so build completes)**

Run:
```bash
cd Vertex-Project/suitevertex
NEXT_PUBLIC_SANITY_PROJECT_ID=dummy NEXT_PUBLIC_SANITY_DATASET=production npm run build
```
Expected: build succeeds. (Pages that fetch will fail to reach a real dataset — acceptable for a build smoke test; full content render is verified after real env is set in Vercel.)

> If build fails because pages eagerly fetch at build time against a dummy project, set those route segments to `export const dynamic = "force-dynamic"` OR provide a real read-only project id. Note the chosen approach in the README.

- [ ] **Step 4: Write README**

`README.md` (sections, written out by the implementer): project overview; required env vars (table from spec §11); `npm install` / `npm run dev`; how to access `/studio`; how to deploy to Vercel; how to wire the Sanity webhook to `/api/revalidate?secret=...`; note that the Vertex CRM endpoint contract must be confirmed (spec §12).

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "docs(suitevertex): README; verify full build and test suite"
```

---

## Deferred / Post-v1 (tracked from spec §12–13)

These are intentionally NOT in this plan; resolve before or shortly after launch:

1. **Vertex CRM contract** — confirm endpoint path/auth/payload; update `lib/crm.ts` + its test (Task 12).
2. **Book-a-call tool** — Cal.com/Calendly embed on Contact/CTA once chosen.
3. **Final color hex + logo asset** — refine tokens in `globals.css`; upload logo to `siteSettings`.
4. **Deployment domain** — replace `https://suitevertex.com` in `sitemap.ts` / `robots.ts` / JSON-LD.
5. **Seed content** — create initial pricing plans, services, comparisons, stats, FAQs in Studio (US mid-market copy).

---

## Self-Review Notes

- **Spec coverage:** Stack (Task 0), UI/branding (Tasks 1–3, color tokens in 0), Sanity setup + 12 schemas (Tasks 4–5), query layer (Task 6), all home sections (7–9), Pricing/How-it-works/About (10–11), Contact→CRM (12–13), Portable Text + Blog/Careers/Legal (14–17), SEO + revalidation (18), verification (19). All spec §5 schema types and §6 pages mapped.
- **Placeholders:** none — every code step contains complete code. The only deferred items are the spec's own open questions (§12), explicitly isolated in the "Deferred" section, not inside tasks.
- **Type consistency:** `sanityFetch<T>({query,params?,tags})`, `ContactInput`, `submitLead`/`validateContact`, `RichText({value})`, and all CMS types are defined once (Tasks 6, 12, 14) and consumed with matching signatures everywhere.
