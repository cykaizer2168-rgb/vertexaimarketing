"use client";

import { Lock, Eye, FileCheck, History, ShieldCheck, Users, type LucideIcon } from "lucide-react";
import { Reveal, SectionTitle } from "./ui";
import { SECURITY, type SecurityPoint } from "@/content/landing";

const ICONS: Record<string, LucideIcon> = {
  lock: Lock,
  eye: Eye,
  file: FileCheck,
  history: History,
  shield: ShieldCheck,
  users: Users,
};

export function TemplateSecurity() {
  return (
    <section id="security" className="scroll-mt-20 bg-[color:var(--color-paper)] py-24">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal className="mb-14">
          <SectionTitle eyebrow={SECURITY.eyebrow} title={SECURITY.title} sub={SECURITY.sub} />
        </Reveal>

        <div className="grid grid-cols-1 gap-x-10 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {SECURITY.points.map((p, i) => (
            <Reveal key={p.title} delay={i * 0.06}>
              <Point point={p} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function Point({ point }: { point: SecurityPoint }) {
  const Icon = ICONS[point.icon] ?? Lock;
  return (
    <div className="text-center">
      <Icon className="mx-auto size-6 text-[color:var(--color-accent)]" />
      <h3 className="mt-4 font-semibold tracking-tight text-[color:var(--color-ink)]">{point.title}</h3>
      <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-black/55">{point.desc}</p>
    </div>
  );
}
