"use client";

import { Check, X } from "lucide-react";
import { Reveal, SectionTitle, TiltCard } from "./ui";
import { AUDIENCE } from "@/content/landing";

export function TemplateAudience() {
  return (
    <section className="bg-[color:var(--color-paper)] py-24">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal className="mb-14">
          <SectionTitle eyebrow={AUDIENCE.eyebrow} title={AUDIENCE.title} />
        </Reveal>

        <div className="grid gap-6 md:grid-cols-2">
          <Reveal className="h-full">
            <TiltCard max={6} className="rounded-2xl bg-white p-8">
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[color:var(--color-accent)]">
                {AUDIENCE.forYou.title}
              </p>
              <ul className="mt-5 space-y-3">
                {AUDIENCE.forYou.items.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-black/70">
                    <Check className="mt-0.5 size-4 shrink-0 text-[color:var(--color-accent)]" strokeWidth={2.5} />
                    {item}
                  </li>
                ))}
              </ul>
            </TiltCard>
          </Reveal>

          <Reveal delay={0.1} className="h-full">
            <TiltCard max={6} className="rounded-2xl bg-white p-8">
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-black/40">
                {AUDIENCE.notForYou.title}
              </p>
              <ul className="mt-5 space-y-3">
                {AUDIENCE.notForYou.items.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-black/50">
                    <X className="mt-0.5 size-4 shrink-0 text-black/30" strokeWidth={2.5} />
                    {item}
                  </li>
                ))}
              </ul>
            </TiltCard>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
