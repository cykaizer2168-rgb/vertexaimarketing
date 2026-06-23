"use client";

import { CheckCircle2 } from "lucide-react";
import { Reveal, Eyebrow, ImagePlaceholder } from "./ui";
import { PROOF } from "@/content/landing";

export function TemplateProof() {
  return (
    <section className="bg-gray-50 py-24">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:px-8">
        <Reveal delay={0.12} className="order-2 lg:order-1">
          <ImagePlaceholder label="Backlog dashboard preview" ratio="aspect-[4/3]" />
        </Reveal>

        <Reveal className="order-1 lg:order-2">
          <Eyebrow>{PROOF.eyebrow}</Eyebrow>
          <h2 className="mt-4 text-3xl font-bold leading-tight tracking-tight text-gray-900 sm:text-4xl">
            {PROOF.title}
          </h2>
          <p className="mt-4 text-base leading-relaxed text-gray-500">{PROOF.sub}</p>
          <ul className="mt-8 space-y-3">
            {PROOF.bullets.map((b) => (
              <li key={b} className="flex items-start gap-3 text-sm font-medium text-gray-700">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-blue-500" />
                {b}
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
