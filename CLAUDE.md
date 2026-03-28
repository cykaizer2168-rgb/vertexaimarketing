# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev      # Start development server
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint
```

No test runner is configured.

## Architecture

This is a **Next.js 16** app using the App Router. The primary deliverable is a **static HTML landing page** (`public/vertex-light-final v4.html`) served via a URL rewrite in `next.config.ts`:

```ts
// Rewrites "/" → the static HTML file in /public
```

The `app/` directory contains a minimal App Router shell (layout, globals) but the actual content lives in the static HTML file. Work on the landing page content happens in `public/vertex-light-final v4.html`, not in `app/`.

## Tech Stack

- **Next.js 16.2.1** with App Router — check `node_modules/next/dist/docs/` for current API behavior before writing any Next.js-specific code
- **React 19**
- **Tailwind CSS v4** — uses `@import "tailwindcss"` (not `@tailwind` directives); no `tailwind.config.*` file
- **TypeScript** with strict mode; path alias `@/*` → project root
- **lucide-react** for icons
