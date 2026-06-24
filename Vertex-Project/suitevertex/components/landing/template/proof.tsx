"use client";

import { Check } from "lucide-react";
import { Reveal, Eyebrow, ImagePlaceholder } from "./ui";
import { PROOF } from "@/content/landing";

export function TemplateProof() {
  return (
    <section className="bg-white py-24">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 lg:grid-cols-2 lg:gap-16">
        <Reveal delay={0.1} className="order-2 lg:order-1">
          <ImagePlaceholder label="Backlog dashboard preview" ratio="aspect-[4/3]" />
        </Reveal>

        <Reveal className="order-1 lg:order-2">
          <Eyebrow>{PROOF.eyebrow}</Eyebrow>
          <h2 className="mt-4 font-display text-3xl font-semibold leading-[1.04] tracking-[-0.02em] text-[color:var(--color-ink)] sm:text-4xl">
            {PROOF.title}
          </h2>
          <p className="mt-4 text-base leading-relaxed text-black/55">{PROOF.sub}</p>
          <ul className="mt-8 divide-y divide-black/10 border-y border-black/10">
            {PROOF.bullets.map((b) => (
              <li key={b} className="flex items-start gap-3 py-3 text-sm text-black/70">
                <Check className="mt-0.5 size-4 shrink-0 text-[color:var(--color-accent)]" strokeWidth={2.5} />
                {b}
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
