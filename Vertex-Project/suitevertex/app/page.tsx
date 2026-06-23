import { CtaProvider, BookCallButton } from "@/components/landing/cta-modal";
import { Hero } from "@/components/landing/hero";
import { NAV_LINKS, BRAND } from "@/content/landing";

export default function LandingPage() {
  return (
    <CtaProvider>
      <div className="min-h-screen bg-ink-950">
        <SiteHeader />
        <main>
          <Hero />
        </main>
      </div>
    </CtaProvider>
  );
}

function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-ink-950/70 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <a href="#top" className="font-display text-lg font-semibold tracking-tight text-white">
          {BRAND.name}
          <span className="text-violet-400">.</span>
        </a>

        <nav className="hidden items-center gap-7 md:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm text-slate-400 transition hover:text-white"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <BookCallButton variant="nav">Book intro call</BookCallButton>
      </div>
    </header>
  );
}
