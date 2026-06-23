"use client";

import { Reveal, BookButton } from "./ui";
import { FINAL_CTA } from "@/content/landing";

export function TemplateFinalCta() {
  return (
    <section id="contact" className="scroll-mt-20 bg-white px-4 py-20 sm:px-6 lg:px-8">
      <Reveal className="mx-auto max-w-5xl">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0b1020] via-[#13183a] to-[#1a1145] px-6 py-14 text-center sm:px-12">
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.12]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,.08) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.08) 1px,transparent 1px)",
              backgroundSize: "48px 48px",
            }}
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-0"
            style={{ background: "radial-gradient(ellipse 60% 60% at 50% 0%,rgba(124,92,255,.25),transparent 70%)" }}
            aria-hidden
          />
          <div className="relative">
            <span className="inline-block rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-blue-200">
              {FINAL_CTA.eyebrow}
            </span>
            <h2 className="mx-auto mt-5 max-w-2xl text-3xl font-bold tracking-tight text-white sm:text-4xl">
              {FINAL_CTA.title}
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-white/65">{FINAL_CTA.body}</p>
            <div className="mt-8 flex justify-center">
              <BookButton size="lg">{FINAL_CTA.cta}</BookButton>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
