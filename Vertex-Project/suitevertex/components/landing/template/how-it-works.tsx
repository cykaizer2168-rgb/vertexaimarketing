"use client";

import { Reveal, SectionTitle, TiltCard } from "./ui";
import { STEPS } from "@/content/landing";

export function TemplateHowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-20 bg-[color:var(--color-paper)] py-24">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal className="mb-14">
          <SectionTitle eyebrow={STEPS.eyebrow} title={STEPS.title} sub={STEPS.sub} />
        </Reveal>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.items.map((step, i) => (
            <Reveal key={step.n} delay={i * 0.08} className="h-full">
              <TiltCard className="rounded-2xl bg-white p-7 text-center">
                <span className="font-display text-3xl font-semibold tracking-tight text-[color:var(--color-accent)]">
                  {step.n}
                </span>
                <h3 className="mt-4 font-semibold tracking-tight text-[color:var(--color-ink)]">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-black/55">{step.body}</p>
              </TiltCard>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
