"use client";

import { Reveal, SectionTitle, TiltCard, ImagePlaceholder } from "./ui";
import { TESTIMONIALS } from "@/content/landing";

export function TemplateTestimonials() {
  return (
    <section className="bg-[color:var(--color-paper)] py-24">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal className="mb-12">
          <SectionTitle eyebrow={TESTIMONIALS.eyebrow} title={TESTIMONIALS.title} sub={TESTIMONIALS.sub} />
        </Reveal>

        {/* client logo strip (placeholders) */}
        <Reveal className="mb-14">
          <p className="mb-5 text-center font-mono text-[11px] uppercase tracking-[0.2em] text-black/35">
            {TESTIMONIALS.logosLabel}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            {Array.from({ length: TESTIMONIALS.logoCount }).map((_, i) => (
              <ImagePlaceholder key={i} label="Logo" ratio="aspect-[3/1]" className="w-28" />
            ))}
          </div>
        </Reveal>

        {/* testimonial cards (placeholders) */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {TESTIMONIALS.items.map((t, i) => (
            <Reveal key={i} delay={i * 0.1} className="h-full">
              <TiltCard max={6} className="flex flex-col rounded-2xl bg-white p-7">
                <p className="flex-1 text-[15px] leading-relaxed text-black/70">&ldquo;{t.quote}&rdquo;</p>
                <div className="mt-6 flex items-center gap-3">
                  <ImagePlaceholder label="" ratio="aspect-square" className="size-10 shrink-0 rounded-full" />
                  <div>
                    <p className="text-sm font-semibold text-[color:var(--color-ink)]">{t.name}</p>
                    <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-black/45">{t.role}</p>
                  </div>
                </div>
              </TiltCard>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
