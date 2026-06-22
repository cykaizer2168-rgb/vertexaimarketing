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
