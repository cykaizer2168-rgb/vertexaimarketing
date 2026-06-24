"use client";

import { Ticket, BookOpen, Activity, Library, GraduationCap, type LucideIcon } from "lucide-react";
import { Reveal, SectionTitle } from "./ui";
import { SUCCESS_CENTER, type SuccessModule } from "@/content/landing";

const ICONS: Record<string, LucideIcon> = {
  ticket: Ticket,
  book: BookOpen,
  activity: Activity,
  library: Library,
  graduation: GraduationCap,
};

export function TemplateSuccessCenter() {
  return (
    <section id="success-center" className="scroll-mt-20 bg-white py-24">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal className="mb-14">
          <SectionTitle eyebrow={SUCCESS_CENTER.eyebrow} title={SUCCESS_CENTER.title} sub={SUCCESS_CENTER.sub} />
        </Reveal>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
          {SUCCESS_CENTER.modules.map((m, i) => (
            <Reveal key={m.title} delay={i * 0.06}>
              <ModuleCell module={m} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function ModuleCell({ module }: { module: SuccessModule }) {
  const Icon = ICONS[module.icon] ?? Ticket;
  return (
    <div className="flex h-full flex-col items-center rounded-2xl bg-[color:var(--color-paper)] p-6 text-center">
      <Icon className="size-6 text-[color:var(--color-accent)]" />
      <h3 className="mt-4 text-sm font-semibold tracking-tight text-[color:var(--color-ink)]">{module.title}</h3>
      <p className="mt-2 text-xs leading-relaxed text-black/55">{module.desc}</p>
    </div>
  );
}
