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
