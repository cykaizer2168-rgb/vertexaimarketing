import type { Metadata } from "next";
import { CtaProvider } from "@/components/landing/cta-modal";
import { SiteHeader } from "@/components/landing/site-header";
import { SiteFooter } from "@/components/landing/site-footer";
import { Pricing } from "@/components/landing/pricing";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Simple monthly plans for ERP, AI automation, and integration work. Starter $2,499/mo, Growth $3,999/mo, Enterprise custom. One-off sprints from $4,999.",
};

export default function PricingPage() {
  return (
    <CtaProvider>
      <div className="min-h-screen bg-ink-950">
        <SiteHeader />
        <main>
          {/* page intro band */}
          <section className="relative overflow-hidden border-b border-white/[0.06]">
            <div aria-hidden className="pointer-events-none absolute inset-0">
              <div className="absolute -top-32 left-1/2 h-96 w-[40rem] -translate-x-1/2 rounded-full bg-violet-700/15 blur-[120px]" />
              <div className="absolute inset-0 bg-[radial-gradient(50rem_30rem_at_50%_-20%,rgba(99,102,241,0.12),transparent)]" />
            </div>
            <div className="relative mx-auto max-w-3xl px-6 pb-4 pt-16 text-center sm:pt-20">
              <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-medium uppercase tracking-wider text-violet-300">
                Pricing
              </span>
              <h1 className="mt-4 font-display text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                Predictable monthly plans for the systems that run your business.
              </h1>
              <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-slate-400">
                One flat fee, a shared backlog, and senior delivery across ERP, integrations, and AI
                automation. Month-to-month — cancel anytime.
              </p>
            </div>
          </section>

          <Pricing showHeading={false} />
        </main>
        <SiteFooter />
      </div>
    </CtaProvider>
  );
}
