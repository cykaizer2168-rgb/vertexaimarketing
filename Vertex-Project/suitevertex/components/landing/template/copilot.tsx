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
    <section id="copilot" className="scroll-mt-20 bg-gradient-to-b from-blue-50/50 to-white py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal className="mb-14">
          <SectionTitle eyebrow={COPILOT.eyebrow} title={COPILOT.title} sub={COPILOT.sub} />
        </Reveal>

        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div className="space-y-4">
            {COPILOT.capabilities.map((c, i) => (
              <Reveal key={c.title} delay={i * 0.08}>
                <Capability cap={c} />
              </Reveal>
            ))}
          </div>

          <Reveal delay={0.15}>
            <ImagePlaceholder
              label="In-NetSuite copilot — grounded answer with citation"
              ratio="aspect-[4/3]"
            />
          </Reveal>
        </div>

        {/* Example questions */}
        <Reveal className="mt-12">
          <p className="text-center text-xs font-semibold uppercase tracking-widest text-gray-400">
            {COPILOT.examplesLabel}
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            {COPILOT.examples.map((q) => (
              <span
                key={q}
                className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm text-gray-600 shadow-sm"
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

function Capability({ cap }: { cap: CopilotCapability }) {
  const Icon = ICONS[cap.icon] ?? Wrench;
  return (
    <div className="flex gap-4 rounded-2xl border border-gray-200 bg-white p-5 transition-all duration-300 hover:border-blue-200 hover:shadow-md">
      <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 text-white">
        <Icon className="size-5" />
      </span>
      <div>
        <h3 className="font-bold text-gray-900">{cap.title}</h3>
        <p className="mt-1 text-sm leading-relaxed text-gray-500">{cap.desc}</p>
      </div>
    </div>
  );
}
