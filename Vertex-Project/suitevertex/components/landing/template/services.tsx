"use client";

import { Reveal, SectionTitle, TiltCard } from "./ui";
import { SERVICES } from "@/content/landing";

export function TemplateServices() {
  return (
    <section id="services" className="scroll-mt-20 bg-[color:var(--color-paper)] py-24">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal className="mb-14">
          <SectionTitle eyebrow={SERVICES.eyebrow} title={SERVICES.title} sub={SERVICES.sub} />
        </Reveal>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {SERVICES.groups.map((group, i) => (
            <Reveal key={group.title} delay={i * 0.1} className="h-full">
              <TiltCard className="rounded-2xl bg-white p-8 text-center">
                <div className="flex items-center justify-center gap-3">
                  <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-black/40">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {group.tag && (
                    <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-[color:var(--color-accent)]">
                      {group.tag}
                    </span>
                  )}
                </div>
                <h3 className="mt-4 text-xl font-semibold tracking-tight text-[color:var(--color-ink)]">
                  {group.title}
                </h3>
                <ul className="mt-5 space-y-2.5">
                  {group.items.map((item) => (
                    <li key={item} className="text-sm text-black/60">
                      {item}
                    </li>
                  ))}
                </ul>
              </TiltCard>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
