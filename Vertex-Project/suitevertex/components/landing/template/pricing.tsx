"use client";

import { Check } from "lucide-react";
import { Reveal, SectionTitle, BookButton } from "./ui";
import { PRICING, PLANS, SPRINT_NOTE, type Plan } from "@/content/landing";

export function TemplatePricing() {
  return (
    <section id="pricing" className="scroll-mt-20 bg-[color:var(--color-paper)] py-24">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal className="mb-14">
          <SectionTitle eyebrow={PRICING.eyebrow} title={PRICING.title} sub={PRICING.sub} />
        </Reveal>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {PLANS.map((plan, i) => (
            <Reveal key={plan.name} delay={i * 0.1}>
              <PlanCard plan={plan} />
            </Reveal>
          ))}
        </div>

        <Reveal className="mt-6">
          <div className="flex flex-col items-start gap-4 border border-black/10 bg-white px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-black/65">{SPRINT_NOTE}</p>
            <BookButton variant="soft" size="sm" className="shrink-0">
              Scope a sprint
            </BookButton>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function PlanCard({ plan }: { plan: Plan }) {
  const featured = plan.featured;
  return (
    <div
      className={[
        "flex h-full flex-col border bg-white p-7",
        featured ? "border-[color:var(--color-accent)]" : "border-black/10",
      ].join(" ")}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold tracking-tight text-[color:var(--color-ink)]">{plan.name}</h3>
        {plan.badge && (
          <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-[color:var(--color-accent)]">
            {plan.badge}
          </span>
        )}
      </div>
      <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.12em] text-black/40">{plan.bestFor}</p>

      <div className="mt-5 flex items-end gap-1 border-b border-black/10 pb-6">
        <span className="font-display text-4xl font-semibold tracking-[-0.02em] text-[color:var(--color-ink)]">
          {plan.price}
        </span>
        {plan.cadence && <span className="mb-1 text-sm text-black/40">{plan.cadence}</span>}
      </div>

      <ul className="mt-6 flex-1 space-y-3">
        {plan.features.map((f) => (
          <li key={f} className="flex items-start gap-2.5 text-sm text-black/65">
            <Check className="mt-0.5 size-4 shrink-0 text-[color:var(--color-accent)]" strokeWidth={2.5} />
            {f}
          </li>
        ))}
      </ul>

      <BookButton variant={featured ? "primary" : "soft"} className="mt-7 w-full">
        {plan.ctaLabel}
      </BookButton>
    </div>
  );
}
