import Link from "next/link";
import { BRAND, FOOTER_LINKS } from "@/content/landing";

export function SiteFooter() {
  return (
    <footer id="contact" className="scroll-mt-20 border-t border-white/[0.06] bg-ink-950">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-6 py-12 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-sm">
          <Link href="/" className="font-display text-lg font-semibold tracking-tight text-white">
            {BRAND.name}
            <span className="text-violet-400">.</span>
          </Link>
          <p className="mt-3 text-sm leading-relaxed text-slate-400">{BRAND.footerLine}</p>
        </div>

        <nav className="flex flex-wrap gap-x-8 gap-y-3">
          {FOOTER_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-slate-400 transition hover:text-white"
            >
              {link.label}
            </Link>
          ))}
          <Link href="/legal/privacy" className="text-sm text-slate-400 transition hover:text-white">
            Privacy
          </Link>
          <Link href="/legal/terms" className="text-sm text-slate-400 transition hover:text-white">
            Terms
          </Link>
        </nav>
      </div>

      <div className="border-t border-white/[0.06]">
        <div className="mx-auto max-w-7xl px-6 py-5 text-xs text-slate-500">
          © {new Date().getFullYear()} {BRAND.name}. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
