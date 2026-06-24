"use client";

import { Reveal, BookButton } from "./ui";
import { FINAL_CTA } from "@/content/landing";

export function TemplateFinalCta() {
  return (
    <section id="contact" className="scroll-mt-20 bg-white px-6 py-20">
      <Reveal className="mx-auto max-w-6xl">
        <div className="border-t-2 border-[color:var(--color-accent)] bg-[color:var(--color-ink)] px-6 py-14 sm:px-12">
          <div className="grid gap-8 lg:grid-cols-[1.4fr_auto] lg:items-end">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-white/50">{FINAL_CTA.eyebrow}</p>
              <h2 className="mt-4 max-w-2xl font-display text-3xl font-semibold tracking-[-0.02em] text-white sm:text-4xl">
                {FINAL_CTA.title}
              </h2>
              <p className="mt-4 max-w-xl text-base leading-relaxed text-white/60">{FINAL_CTA.body}</p>
            </div>
            <BookButton size="lg" className="lg:mb-1">
              {FINAL_CTA.cta}
            </BookButton>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
