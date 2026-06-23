import Link from "next/link";
import { BookCallButton } from "./cta-modal";
import { NAV_LINKS, BRAND } from "@/content/landing";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-ink-950/70 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link href="/" className="font-display text-lg font-semibold tracking-tight text-white">
          {BRAND.name}
          <span className="text-violet-400">.</span>
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-slate-400 transition hover:text-white"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <BookCallButton variant="nav">Book intro call</BookCallButton>
      </div>
    </header>
  );
}
