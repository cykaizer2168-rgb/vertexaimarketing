import { Check, Zap } from "lucide-react";
import { Section, SectionHeading } from "./section";
import { BookCallButton } from "./cta-modal";
import { PRICING, PLANS, SPRINT_NOTE, type Plan } from "@/content/landing";

export function Pricing({ showHeading = true }: { showHeading?: boolean }) {
  return (
    <Section id="pricing">
      {showHeading && (
        <SectionHeading eyebrow={PRICING.eyebrow} title={PRICING.title} subtitle={PRICING.subtitle} />
      )}

      <div className={`grid gap-6 lg:grid-cols-3 ${showHeading ? "mt-14" : ""}`}>
        {PLANS.map((plan) => (
          <PlanCard key={plan.name} plan={plan} />
        ))}
      </div>

      {/* one-time sprint strip */}
      <div className="mx-auto mt-8 flex max-w-3xl flex-col items-center gap-4 rounded-2xl border border-white/10 bg-gradient-to-r from-blue-500/[0.08] to-violet-500/[0.08] px-6 py-5 text-center sm:flex-row sm:justify-between sm:text-left">
        <div className="flex items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/[0.05] text-violet-300">
            <Zap className="size-5" />
          </span>
          <p className="text-sm text-slate-300">{SPRINT_NOTE}</p>
        </div>
        <BookCallButton variant="outline" className="h-11 px-5 shrink-0">
          Scope a sprint
        </BookCallButton>
      </div>
    </Section>
  );
}

function PlanCard({ plan }: { plan: Plan }) {
  const featured = plan.featured;
  return (
    <div
      className={[
        "relative flex flex-col rounded-2xl border p-7",
        featured
          ? "border-violet-400/40 bg-white/[0.04] shadow-2xl shadow-violet-950/40 lg:-translate-y-3"
          : "border-white/10 bg-white/[0.02]",
      ].join(" ")}
    >
      {featured && (
        <>
          <div
            aria-hidden
            className="pointer-events-none absolute -inset-px -z-10 rounded-2xl bg-gradient-to-b from-violet-500/30 to-transparent blur"
          />
          <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-blue-500 to-violet-600 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white shadow-lg shadow-violet-900/40">
            Most popular
          </span>
        </>
      )}

      <h3 className="font-display text-lg font-semibold text-white">{plan.name}</h3>
      <p className="mt-1 text-sm text-slate-400">{plan.bestFor}</p>

      <div className="mt-5 flex items-end gap-1">
        <span className="font-display text-4xl font-semibold text-white">{plan.price}</span>
        {plan.cadence && <span className="mb-1 text-sm text-slate-500">{plan.cadence}</span>}
      </div>

      <ul className="mt-6 flex-1 space-y-3">
        {plan.features.map((feature) => (
          <li key={feature} className="flex items-start gap-3 text-sm text-slate-300">
            <span
              className={[
                "mt-0.5 grid size-5 shrink-0 place-items-center rounded-full",
                featured ? "bg-violet-500/20 text-violet-300" : "bg-white/[0.06] text-slate-300",
              ].join(" ")}
            >
              <Check className="size-3" strokeWidth={3} />
            </span>
            {feature}
          </li>
        ))}
      </ul>

      <BookCallButton
        variant={featured ? "primary" : "outline"}
        className="mt-7 w-full"
      >
        {plan.ctaLabel}
      </BookCallButton>
    </div>
  );
}
