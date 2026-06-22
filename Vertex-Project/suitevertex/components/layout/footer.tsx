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
