"use client";

import { Reveal, SectionTitle } from "./ui";
import { SERVICES } from "@/content/landing";

export function TemplateServices() {
  return (
    <section id="services" className="scroll-mt-20 bg-[color:var(--color-paper)] py-24">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal>
          <div className="flex flex-col gap-6 border-b border-black/10 pb-10 md:flex-row md:items-end md:justify-between">
            <SectionTitle eyebrow={SERVICES.eyebrow} title={SERVICES.title} />
            <p className="max-w-xs text-sm leading-relaxed text-black/55">{SERVICES.sub}</p>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-3 md:divide-x md:divide-black/10">
          {SERVICES.groups.map((group, i) => (
            <Reveal key={group.title} delay={i * 0.1}>
              <div className="py-8 md:px-8 md:first:pl-0 md:last:pr-0">
                <div className="flex items-baseline justify-between">
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
                <ul className="mt-5 divide-y divide-black/10 border-y border-black/10">
                  {group.items.map((item) => (
                    <li key={item} className="py-2.5 text-sm text-black/65">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
