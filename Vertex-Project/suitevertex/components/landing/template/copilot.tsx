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
        <Reveal className="mb-14">
          <SectionTitle eyebrow={COPILOT.eyebrow} title={COPILOT.title} sub={COPILOT.sub} />
        </Reveal>

        <div className="grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-16">
          <div className="space-y-7">
            {COPILOT.capabilities.map((c, i) => (
              <Reveal key={c.title} delay={i * 0.06}>
                <Capability cap={c} />
              </Reveal>
            ))}
          </div>

          <Reveal delay={0.1}>
            <ImagePlaceholder label="In-NetSuite copilot — grounded answer with citation" ratio="aspect-[4/3]" />
          </Reveal>
        </div>

        <Reveal className="mt-14 text-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-black/40">{COPILOT.examplesLabel}</p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            {COPILOT.examples.map((q) => (
              <span key={q} className="rounded-full bg-[color:var(--color-paper)] px-4 py-2 text-sm text-black/65">
                &ldquo;{q}&rdquo;
              </span>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function Capability({ cap }: { cap: CopilotCapability }) {
  const Icon = ICONS[cap.icon] ?? Wrench;
  return (
    <div className="flex gap-4">
      <Icon className="mt-0.5 size-5 shrink-0 text-[color:var(--color-accent)]" />
      <div>
        <h3 className="font-semibold tracking-tight text-[color:var(--color-ink)]">{cap.title}</h3>
        <p className="mt-1 text-sm leading-relaxed text-black/55">{cap.desc}</p>
      </div>
    </div>
  );
}
