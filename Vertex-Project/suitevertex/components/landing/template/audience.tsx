"use client";

import { Check, X } from "lucide-react";
import { Reveal, SectionTitle } from "./ui";
import { AUDIENCE } from "@/content/landing";

export function TemplateAudience() {
  return (
    <section className="bg-gray-50 py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal className="mb-14">
          <SectionTitle eyebrow={AUDIENCE.eyebrow} title={AUDIENCE.title} />
        </Reveal>

        <div className="grid gap-6 md:grid-cols-2">
          <Reveal>
            <div className="h-full rounded-3xl border border-emerald-100 bg-white p-8">
              <h3 className="flex items-center gap-2 text-lg font-bold text-gray-900">
                <span className="grid size-7 place-items-center rounded-full bg-emerald-100 text-emerald-600">
                  <Check className="size-4" strokeWidth={3} />
                </span>
                {AUDIENCE.forYou.title}
              </h3>
              <ul className="mt-5 space-y-3">
                {AUDIENCE.forYou.items.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-gray-600">
                    <Check className="mt-0.5 size-4 shrink-0 text-emerald-500" strokeWidth={2.5} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>

          <Reveal delay={0.12}>
            <div className="h-full rounded-3xl border border-gray-200 bg-white p-8">
              <h3 className="flex items-center gap-2 text-lg font-bold text-gray-900">
                <span className="grid size-7 place-items-center rounded-full bg-gray-100 text-gray-500">
                  <X className="size-4" strokeWidth={3} />
                </span>
                {AUDIENCE.notForYou.title}
              </h3>
              <ul className="mt-5 space-y-3">
                {AUDIENCE.notForYou.items.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-gray-500">
                    <X className="mt-0.5 size-4 shrink-0 text-gray-400" strokeWidth={2.5} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
