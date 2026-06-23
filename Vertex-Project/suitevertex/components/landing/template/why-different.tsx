"use client";

import { Reveal, Eyebrow } from "./ui";
import { WHY_DIFFERENT } from "@/content/landing";

export function TemplateWhyDifferent() {
  return (
    <section className="bg-white py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal className="mx-auto max-w-3xl text-center">
          <Eyebrow>{WHY_DIFFERENT.eyebrow}</Eyebrow>
          <h2 className="mt-4 text-3xl font-bold leading-tight tracking-tight text-gray-900 sm:text-4xl md:text-5xl">
            {WHY_DIFFERENT.headlineLead}
            <br />
            <span className="bg-gradient-to-r from-blue-500 to-violet-600 bg-clip-text text-transparent">
              {WHY_DIFFERENT.headlineSub}
            </span>
          </h2>
          <div className="mt-6 space-y-4 text-base leading-relaxed text-gray-500">
            {WHY_DIFFERENT.copy.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
        </Reveal>

        <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {WHY_DIFFERENT.metrics.map((m, i) => (
            <Reveal key={m.label} delay={i * 0.1}>
              <div className="h-full rounded-3xl border border-gray-200 bg-gray-50 p-8 text-center">
                <div className="bg-gradient-to-r from-blue-500 to-violet-600 bg-clip-text text-5xl font-extrabold tracking-tight text-transparent">
                  {m.value}
                </div>
                <p className="mt-3 text-sm leading-relaxed text-gray-600">{m.label}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
