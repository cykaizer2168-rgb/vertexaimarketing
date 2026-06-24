"use client";

import { Reveal, BookButton } from "./ui";
import { FINAL_CTA } from "@/content/landing";

export function TemplateFinalCta() {
  return (
    <section id="contact" className="scroll-mt-20 bg-white px-6 py-20">
      <Reveal className="mx-auto max-w-5xl">
        <div className="rounded-3xl bg-[color:var(--color-ink)] px-6 py-16 text-center sm:px-12">
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-white/50">{FINAL_CTA.eyebrow}</p>
          <h2 className="mx-auto mt-4 max-w-2xl font-display text-3xl font-semibold tracking-[-0.02em] text-white sm:text-4xl md:text-5xl">
            {FINAL_CTA.title}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-white/60">{FINAL_CTA.body}</p>
          <div className="mt-8 flex justify-center">
            <BookButton size="lg">{FINAL_CTA.cta}</BookButton>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
