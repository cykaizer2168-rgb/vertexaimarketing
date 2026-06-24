"use client";

import { Reveal, SectionTitle } from "./ui";
import { STEPS } from "@/content/landing";

export function TemplateHowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-20 bg-white py-24">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal className="mb-14">
          <SectionTitle eyebrow={STEPS.eyebrow} title={STEPS.title} sub={STEPS.sub} />
        </Reveal>

        <div className="grid grid-cols-1 gap-px bg-black/10 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.items.map((step, i) => (
            <Reveal key={step.n} delay={i * 0.08}>
              <div className="h-full bg-white p-7">
                <div className="flex items-center justify-between border-b border-black/10 pb-4">
                  <span className="font-display text-3xl font-semibold tracking-tight text-[color:var(--color-ink)]">
                    {step.n}
                  </span>
                  <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-[color:var(--color-accent)]">
                    Step
                  </span>
                </div>
                <h3 className="mt-5 font-semibold tracking-tight text-[color:var(--color-ink)]">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-black/55">{step.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
