import Image from "next/image";
import { BRAND, FOOTER_NAV, FOOTER_LEGAL } from "@/content/landing";

export function TemplateFooter() {
  return (
    <footer className="bg-[color:var(--color-ink)] text-white">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-14 md:grid-cols-[1.6fr_1fr_1fr]">
        <div className="max-w-sm">
          <Image
            src="/logos/suitevertex-logo-trans.png"
            alt="SuiteVertex"
            width={160}
            height={33}
            className="h-7 w-auto"
          />
          <p className="mt-5 text-sm leading-relaxed text-white/50">{BRAND.footerLine}</p>
        </div>

        <div>
          <h3 className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/40">Company</h3>
          <ul className="mt-4 space-y-3">
            {FOOTER_NAV.map((l) => (
              <li key={l.href}>
                <a href={l.href} className="text-sm text-white/60 transition hover:text-white">
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/40">Legal</h3>
          <ul className="mt-4 space-y-3">
            {FOOTER_LEGAL.map((l) => (
              <li key={l.href}>
                <a href={l.href} className="text-sm text-white/60 transition hover:text-white">
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-5">
        <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-white/35">
          © {new Date().getFullYear()} {BRAND.name} — All rights reserved.
        </p>
      </div>
    </footer>
  );
}
