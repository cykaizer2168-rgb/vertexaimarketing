import { Hero } from "@/components/sections/hero";
import { Stats } from "@/components/sections/stats";
import { PricingCards } from "@/components/sections/pricing-cards";
import { Comparison } from "@/components/sections/comparison";
import { ServicesGrid } from "@/components/sections/services-grid";
import { SocialProof } from "@/components/sections/social-proof";
import { Faq } from "@/components/sections/faq";
import { Cta } from "@/components/sections/cta";
import { sanityFetch } from "@/sanity/lib/fetch";
import * as Q from "@/sanity/lib/queries";
import type { Stat, PricingPlan, Comparison as C, Service, Testimonial, Faq as F } from "@/sanity/lib/types";

export default async function HomePage() {
  const [stats, plans, comparisons, services, testimonials, faqs] = await Promise.all([
    sanityFetch<Stat[]>({ query: Q.STATS_QUERY, tags: ["stat"] }),
    sanityFetch<PricingPlan[]>({ query: Q.PRICING_PLANS_QUERY, tags: ["pricingPlan"] }),
    sanityFetch<C[]>({ query: Q.COMPARISONS_QUERY, tags: ["comparison"] }),
    sanityFetch<Service[]>({ query: Q.SERVICES_QUERY, tags: ["service"] }),
    sanityFetch<Testimonial[]>({ query: Q.TESTIMONIALS_QUERY, tags: ["testimonial"] }),
    sanityFetch<F[]>({ query: Q.FAQS_QUERY, params: { page: "home" }, tags: ["faq"] }),
  ]);
  return (
    <main>
      <Hero />
      <Stats items={stats} />
      <PricingCards plans={plans} />
      <Comparison items={comparisons} />
      <ServicesGrid items={services} />
      <SocialProof items={testimonials} />
      <Faq items={faqs} />
      <Cta />
    </main>
  );
}
