import { Check, ArrowRight, Sparkles } from "lucide-react";
import { BookCallButton } from "./cta-modal";
import { HERO } from "@/content/landing";
import { HeroBacklog } from "./hero-backlog";

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* Atmosphere */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-1/2 h-[42rem] w-[42rem] -translate-x-1/2 rounded-full bg-violet-700/20 blur-[120px]" />
        <div className="absolute -left-32 top-40 h-[28rem] w-[28rem] rounded-full bg-blue-700/20 blur-[120px]" />
        <div className="absolute inset-0 bg-[radial-gradient(60rem_40rem_at_70%_-10%,rgba(99,102,241,0.12),transparent)]" />
        <div className="absolute inset-0 opacity-[0.18] [background-image:linear-gradient(to_right,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:56px_56px] [mask-image:radial-gradient(40rem_30rem_at_50%_0%,#000,transparent)]" />
      </div>

      <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-6 pb-20 pt-16 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10 lg:pb-28 lg:pt-24">
        {/* Copy */}
        <div>
          <span className="sv-rise inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1.5 text-xs font-medium text-slate-300">
            <Sparkles className="size-3.5 text-violet-300" />
            {HERO.eyebrow}
          </span>

          <h1
            className="sv-rise mt-6 font-display text-4xl font-semibold leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-6xl"
            style={{ animationDelay: "60ms" }}
          >
            Your ERP, AI Automation, and Integration Team —{" "}
            <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-violet-400 bg-clip-text text-transparent">
              on a Monthly Plan.
            </span>
          </h1>

          <p
            className="sv-rise mt-6 max-w-xl text-lg leading-relaxed text-slate-400"
            style={{ animationDelay: "120ms" }}
          >
            {HERO.sub}
          </p>

          <div
            className="sv-rise mt-9 flex flex-col gap-3 sm:flex-row sm:items-center"
            style={{ animationDelay: "180ms" }}
          >
            <BookCallButton variant="primary">
              {HERO.primaryCta}
              <ArrowRight className="size-4" />
            </BookCallButton>
            <a
              href="#pricing"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-white/15 px-6 text-sm font-semibold text-slate-100 transition hover:bg-white/5"
            >
              {HERO.secondaryCta}
            </a>
          </div>

          <ul
            className="sv-rise mt-10 grid max-w-xl grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2"
            style={{ animationDelay: "240ms" }}
          >
            {HERO.badges.map((badge) => (
              <li key={badge} className="flex items-center gap-2.5 text-sm text-slate-300">
                <span className="grid size-5 shrink-0 place-items-center rounded-full bg-emerald-500/15 text-emerald-400">
                  <Check className="size-3" strokeWidth={3} />
                </span>
                {badge}
              </li>
            ))}
          </ul>
        </div>

        {/* Visual */}
        <div className="sv-rise lg:justify-self-end" style={{ animationDelay: "200ms" }}>
          <HeroBacklog />
        </div>
      </div>
    </section>
  );
}
