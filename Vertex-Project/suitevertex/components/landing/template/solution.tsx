"use client";

import { CheckCircle2 } from "lucide-react";
import { Reveal, Eyebrow, ImagePlaceholder } from "./ui";
import { SOLUTION } from "@/content/landing";

export function TemplateSolution() {
  return (
    <section className="bg-white py-24">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:px-8">
        <Reveal>
          <Eyebrow>{SOLUTION.eyebrow}</Eyebrow>
          <h2 className="mt-4 text-3xl font-bold leading-tight tracking-tight text-gray-900 sm:text-4xl">
            {SOLUTION.title}
          </h2>
          <p className="mt-4 text-base leading-relaxed text-gray-500">{SOLUTION.body}</p>

          <ul className="mt-8 grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
            {SOLUTION.highlights.map((h) => (
              <li key={h} className="flex items-start gap-2.5 text-sm font-medium text-gray-700">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-blue-500" />
                {h}
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal delay={0.15}>
          <ImagePlaceholder label="Delivery dashboard preview" ratio="aspect-[4/3]" />
        </Reveal>
      </div>
    </section>
  );
}
