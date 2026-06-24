"use client";

import { Reveal, Eyebrow, CountUp } from "./ui";
import { WHY_DIFFERENT } from "@/content/landing";

export function TemplateWhyDifferent() {
  return (
    <section className="bg-white py-24">
      <div className="mx-auto max-w-3xl px-6 text-center">
        <Reveal>
          <Eyebrow>{WHY_DIFFERENT.eyebrow}</Eyebrow>
          <h2 className="mt-4 font-display text-3xl font-semibold leading-[1.04] tracking-[-0.02em] text-[color:var(--color-ink)] sm:text-4xl md:text-5xl">
            {WHY_DIFFERENT.headlineLead}{" "}
            <span className="text-[color:var(--color-accent)]">{WHY_DIFFERENT.headlineSub}</span>
          </h2>
          <div className="mt-5 space-y-4 text-base leading-relaxed text-black/60">
            {WHY_DIFFERENT.copy.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
        </Reveal>
      </div>

      <div className="mx-auto mt-16 grid max-w-5xl grid-cols-1 gap-10 px-6 sm:grid-cols-3">
        {WHY_DIFFERENT.metrics.map((m, i) => (
          <Reveal key={m.label} delay={i * 0.1} className="text-center">
            <CountUp
              value={m.value}
              className="block font-display text-5xl font-semibold tracking-[-0.02em] text-[color:var(--color-ink)]"
            />
            <p className="mx-auto mt-3 max-w-[16rem] text-sm leading-relaxed text-black/55">{m.label}</p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
