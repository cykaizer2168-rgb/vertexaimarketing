"use client";

import { motion } from "framer-motion";
import { CheckCircle2, Zap } from "lucide-react";
import { Reveal, SectionTitle, BookButton, cardHover, cardHoverTransition } from "./ui";
import { PRICING, PLANS, SPRINT_NOTE, type Plan } from "@/content/landing";

export function TemplatePricing() {
  return (
    <section id="pricing" className="scroll-mt-20 bg-white py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal className="mb-14">
          <SectionTitle eyebrow={PRICING.eyebrow} title={PRICING.title} sub={PRICING.sub} />
        </Reveal>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {PLANS.map((plan, i) => (
            <PlanCard key={plan.name} plan={plan} delay={i * 0.12} />
          ))}
        </div>

        <Reveal className="mx-auto mt-8 max-w-3xl">
          <div className="flex flex-col items-center gap-4 rounded-3xl border border-blue-100 bg-gradient-to-r from-blue-50 to-violet-50 px-6 py-5 text-center sm:flex-row sm:justify-between sm:text-left">
            <div className="flex items-center gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white text-violet-600 shadow-sm">
                <Zap className="size-5" />
              </span>
              <p className="text-sm font-medium text-gray-700">{SPRINT_NOTE}</p>
            </div>
            <BookButton variant="soft" size="sm" className="shrink-0">
              Scope a sprint
            </BookButton>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function PlanCard({ plan, delay }: { plan: Plan; delay: number }) {
  const featured = plan.featured;
  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.55, delay }}
      whileHover={{ ...cardHover, transition: cardHoverTransition }}
      className={`relative flex flex-col rounded-3xl border-2 p-7 ${
        featured
          ? "border-violet-400 shadow-xl shadow-violet-100"
          : "border-gray-200 hover:border-gray-300 hover:shadow-lg"
      }`}
    >
      {plan.badge && (
        <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-gradient-to-r from-blue-500 to-violet-600 px-4 py-1 text-xs font-bold text-white shadow-md">
          {plan.badge}
        </span>
      )}

      <div className="mb-6">
        <h3 className="mb-1 text-xl font-bold text-gray-900">{plan.name}</h3>
        <p className="mb-4 text-xs uppercase tracking-wide text-gray-400">{plan.bestFor}</p>
        <div className="flex items-end gap-1">
          <span className="text-3xl font-extrabold text-gray-900 sm:text-4xl">{plan.price}</span>
          {plan.cadence && <span className="mb-1 text-sm text-gray-400">{plan.cadence}</span>}
        </div>
      </div>

      <ul className="mb-8 flex-1 space-y-3">
        {plan.features.map((f) => (
          <li key={f} className="flex items-start gap-2.5 text-sm text-gray-600">
            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-violet-500" />
            {f}
          </li>
        ))}
      </ul>

      <BookButton
        variant={featured ? "primary" : "soft"}
        className="w-full"
      >
        {plan.ctaLabel}
      </BookButton>
    </motion.div>
  );
}
