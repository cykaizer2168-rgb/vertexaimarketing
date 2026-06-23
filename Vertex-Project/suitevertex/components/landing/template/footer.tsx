import { ImageIcon } from "lucide-react";
import { BRAND, FOOTER_NAV, FOOTER_LEGAL } from "@/content/landing";

export function TemplateFooter() {
  return (
    <footer className="bg-[#070a14] text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr] lg:px-8">
        {/* Brand */}
        <div className="max-w-sm">
          <div className="flex items-center gap-2.5">
            {/* logo image placeholder */}
            <span className="grid size-9 place-items-center rounded-lg border border-dashed border-white/25 bg-white/[0.04] text-white/40">
              <ImageIcon className="size-4" />
            </span>
            <span className="text-lg font-bold tracking-tight">{BRAND.name}</span>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-white/50">{BRAND.footerLine}</p>
        </div>

        {/* Company */}
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-widest text-white/40">Company</h3>
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

        {/* Legal */}
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-widest text-white/40">Legal</h3>
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

      <div className="border-t border-white/[0.06]">
        <div className="mx-auto max-w-7xl px-4 py-5 text-xs text-white/40 sm:px-6 lg:px-8">
          © {new Date().getFullYear()} {BRAND.name}. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
