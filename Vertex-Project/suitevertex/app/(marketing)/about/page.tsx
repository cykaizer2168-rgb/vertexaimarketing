import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { Stats } from "@/components/sections/stats";
import { Cta } from "@/components/sections/cta";
import { sanityFetch } from "@/sanity/lib/fetch";
import * as Q from "@/sanity/lib/queries";
import type { Stat } from "@/sanity/lib/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "About", description: "SuiteVertex is a team of senior NetSuite engineers serving US mid-market finance and operations teams." };

export default async function AboutPage() {
  const stats = await sanityFetch<Stat[]>({ query: Q.STATS_QUERY, tags: ["stat"] });
  return (
    <main>
      <Container className="py-20 max-w-3xl">
        <SectionHeading align="left" eyebrow="About" title="We built the monthly plan we wished existed" />
        <div className="mt-6 space-y-4 text-lg text-navy-800/70">
          <p>Every NetSuite buyer we talked to asked the same thing: can we just pay you monthly and stop dealing with hourly invoices? SuiteVertex is our answer.</p>
          <p>We are senior NetSuite engineers focused on US mid-market finance and operations teams — the work managed, not nickel-and-dimed.</p>
        </div>
      </Container>
      <Stats items={stats} />
      <Cta />
    </main>
  );
}
