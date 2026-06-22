import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { PricingCards } from "@/components/sections/pricing-cards";
import { Faq } from "@/components/sections/faq";
import { sanityFetch } from "@/sanity/lib/fetch";
import * as Q from "@/sanity/lib/queries";
import type { PricingPlan, Faq as F } from "@/sanity/lib/types";

export const metadata: Metadata = { title: "Pricing", description: "Flat monthly NetSuite plans from $2,499. No commitment, cancel anytime." };

export default async function PricingPage() {
  const [plans, faqs] = await Promise.all([
    sanityFetch<PricingPlan[]>({ query: Q.PRICING_PLANS_QUERY, tags: ["pricingPlan"] }),
    sanityFetch<F[]>({ query: Q.FAQS_QUERY, params: { page: "pricing" }, tags: ["faq"] }),
  ]);
  return (
    <main>
      <Container className="py-20 text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Pay monthly. No commitment.</h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-navy-800/70">Three plans for growing NetSuite teams. Just need one project? Implementation sprints run flat at $4,999.</p>
      </Container>
      <PricingCards plans={plans} />
      <Faq items={faqs} />
    </main>
  );
}
