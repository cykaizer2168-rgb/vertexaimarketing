import { Container } from "@/components/ui/container";
import { ButtonLink } from "@/components/ui/button";
import { SITE } from "@/content/site";

export function Cta() {
  return (
    <section className="bg-indigo-600 py-20 text-white">
      <Container className="text-center">
        <h2 className="text-3xl font-bold sm:text-4xl">Stop dealing with hourly invoices.</h2>
        <p className="mx-auto mt-4 max-w-xl text-lg text-white/80">One team, predictable monthly fee, senior eyes on everything. Book a 15-minute intro call.</p>
        <ButtonLink href="/contact" size="lg" variant="outline" className="mt-8 border-white bg-white text-indigo-600 hover:bg-white/90">{SITE.cta.book}</ButtonLink>
      </Container>
    </section>
  );
}
