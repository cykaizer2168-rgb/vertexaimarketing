import { ImageIcon } from "lucide-react";
import { BRAND, FOOTER_LINKS } from "@/content/landing";

export function TemplateFooter() {
  return (
    <footer className="bg-[#070a14] text-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-10 px-4 py-14 sm:px-6 md:flex-row md:items-start md:justify-between lg:px-8">
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

        <nav className="flex flex-wrap gap-x-8 gap-y-3">
          {FOOTER_LINKS.map((l) => (
            <a key={l.href} href={l.href} className="text-sm text-white/60 transition hover:text-white">
              {l.label}
            </a>
          ))}
        </nav>
      </div>

      <div className="border-t border-white/[0.06]">
        <div className="mx-auto max-w-7xl px-4 py-5 text-xs text-white/40 sm:px-6 lg:px-8">
          © {new Date().getFullYear()} {BRAND.name}. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
