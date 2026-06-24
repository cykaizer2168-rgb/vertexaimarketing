"use client";

import { Reveal, Eyebrow, CountUp } from "./ui";
import { WHY_DIFFERENT } from "@/content/landing";

export function TemplateWhyDifferent() {
  return (
    <section className="bg-white py-24">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal>
          <div className="grid gap-8 border-b border-black/10 pb-12 lg:grid-cols-2 lg:gap-16">
            <div>
              <Eyebrow>{WHY_DIFFERENT.eyebrow}</Eyebrow>
              <h2 className="mt-4 font-display text-3xl font-semibold leading-[1.04] tracking-[-0.02em] text-[color:var(--color-ink)] sm:text-4xl">
                {WHY_DIFFERENT.headlineLead}
                <br />
                <span className="text-[color:var(--color-accent)]">{WHY_DIFFERENT.headlineSub}</span>
              </h2>
            </div>
            <div className="space-y-4 self-end text-base leading-relaxed text-black/60">
              {WHY_DIFFERENT.copy.map((p) => (
                <p key={p}>{p}</p>
              ))}
            </div>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 sm:grid-cols-3 sm:divide-x sm:divide-black/10">
          {WHY_DIFFERENT.metrics.map((m, i) => (
            <Reveal key={m.label} delay={i * 0.1}>
              <div className="py-10 sm:px-8 sm:first:pl-0 sm:last:pr-0">
                <CountUp
                  value={m.value}
                  className="block font-display text-5xl font-semibold tracking-[-0.02em] text-[color:var(--color-ink)]"
                />
                <p className="mt-3 max-w-[16rem] text-sm leading-relaxed text-black/55">{m.label}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
