import { UserPlus, Building2, Globe, type LucideIcon } from "lucide-react";
import { Section } from "./section";
import { PROBLEM, type ProblemOption } from "@/content/landing";

const ICONS: Record<ProblemOption["icon"], LucideIcon> = {
  hire: UserPlus,
  firm: Building2,
  freelance: Globe,
};

export function Problem() {
  return (
    <Section id="alternatives" className="bg-[#071827]">
      {/* Two-column header */}
      <div className="grid gap-8 lg:grid-cols-2 lg:gap-16">
        <div>
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-400">
            {PROBLEM.eyebrow}
          </span>
          <h2 className="mt-4 font-display text-3xl font-semibold leading-[1.1] tracking-tight text-white sm:text-4xl lg:text-5xl">
            {PROBLEM.titleLead}{" "}
            <em className="italic text-orange-400">{PROBLEM.titleEmphasis}</em>
          </h2>
        </div>
        <div className="flex items-end">
          <p className="text-lg leading-relaxed text-slate-400">{PROBLEM.paragraph}</p>
        </div>
      </div>

      {/* Comparison cards */}
      <div className="mt-14 grid gap-6 md:grid-cols-3">
        {PROBLEM.options.map((option) => (
          <OptionCard key={option.label} option={option} />
        ))}
      </div>

      {/* What we built instead — orange strip */}
      <div className="mt-8 overflow-hidden rounded-3xl bg-gradient-to-r from-orange-500 to-amber-500 shadow-2xl shadow-orange-950/30">
        <div className="grid gap-6 p-8 sm:p-10 lg:grid-cols-[1.5fr_1fr_auto] lg:items-center lg:gap-10">
          <div>
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-950/70">
              {PROBLEM.strip.eyebrow}
            </span>
            <h3 className="mt-2 font-display text-2xl font-semibold leading-tight text-[#0a0a0f] sm:text-3xl">
              {PROBLEM.strip.headline}
            </h3>
          </div>
          <p className="text-[15px] leading-relaxed text-[#0a0a0f]/80">{PROBLEM.strip.middle}</p>
          <div className="flex items-baseline gap-1 lg:justify-end">
            <span className="font-display text-4xl font-bold text-[#0a0a0f]">
              {PROBLEM.strip.price}
            </span>
            <span className="text-sm font-medium text-[#0a0a0f]/70">{PROBLEM.strip.priceNote}</span>
          </div>
        </div>
      </div>
    </Section>
  );
}

function OptionCard({ option }: { option: ProblemOption }) {
  const Icon = ICONS[option.icon];
  return (
    <div className="flex flex-col rounded-2xl border border-white/10 bg-white/[0.03] p-7 transition hover:border-white/20 hover:bg-white/[0.05]">
      <span className="grid size-11 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-orange-400">
        <Icon className="size-5" />
      </span>

      <span className="mt-5 text-[11px] font-semibold uppercase tracking-[0.16em] text-orange-400">
        {option.label}
      </span>
      <h3 className="mt-1.5 font-display text-xl font-semibold text-white">{option.title}</h3>
      <p className="mt-3 flex-1 text-sm leading-relaxed text-slate-400">{option.body}</p>

      <div className="mt-6 border-t border-white/[0.08] pt-5">
        <div className="flex items-baseline gap-1.5">
          <span className="font-display text-2xl font-semibold text-white">{option.price}</span>
          <span className="text-xs text-slate-500">{option.priceNote}</span>
        </div>
      </div>
    </div>
  );
}
