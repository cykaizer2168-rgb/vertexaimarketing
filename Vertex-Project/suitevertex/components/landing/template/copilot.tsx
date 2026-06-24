"use client";

import { Wrench, Search, History, ShieldCheck, type LucideIcon } from "lucide-react";
import { Reveal, SectionTitle, ImagePlaceholder } from "./ui";
import { COPILOT, type CopilotCapability } from "@/content/landing";

const ICONS: Record<string, LucideIcon> = {
  wrench: Wrench,
  search: Search,
  history: History,
  shield: ShieldCheck,
};

export function TemplateCopilot() {
  return (
    <section id="copilot" className="scroll-mt-20 bg-white py-24">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal className="border-b border-black/10 pb-10">
          <SectionTitle eyebrow={COPILOT.eyebrow} title={COPILOT.title} sub={COPILOT.sub} />
        </Reveal>

        <div className="grid gap-12 pt-12 lg:grid-cols-2 lg:items-start lg:gap-16">
          <div className="divide-y divide-black/10 border-y border-black/10">
            {COPILOT.capabilities.map((c, i) => (
              <Reveal key={c.title} delay={i * 0.06}>
                <Capability cap={c} index={i + 1} />
              </Reveal>
            ))}
          </div>

          <Reveal delay={0.1}>
            <ImagePlaceholder label="In-NetSuite copilot — grounded answer with citation" ratio="aspect-[4/3]" />
          </Reveal>
        </div>

        {/* example questions — mono chips */}
        <Reveal className="mt-14">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-black/40">{COPILOT.examplesLabel}</p>
          <div className="mt-5 flex flex-wrap gap-3">
            {COPILOT.examples.map((q) => (
              <span
                key={q}
                className="border border-black/12 px-4 py-2 text-sm text-black/65"
              >
                &ldquo;{q}&rdquo;
              </span>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function Capability({ cap, index }: { cap: CopilotCapability; index: number }) {
  const Icon = ICONS[cap.icon] ?? Wrench;
  return (
    <div className="flex gap-5 py-5">
      <span className="mt-0.5 flex items-center gap-2 font-mono text-[11px] text-black/35">
        {String(index).padStart(2, "0")}
      </span>
      <Icon className="mt-0.5 size-5 shrink-0 text-[color:var(--color-accent)]" />
      <div>
        <h3 className="font-semibold tracking-tight text-[color:var(--color-ink)]">{cap.title}</h3>
        <p className="mt-1 text-sm leading-relaxed text-black/55">{cap.desc}</p>
      </div>
    </div>
  );
}
