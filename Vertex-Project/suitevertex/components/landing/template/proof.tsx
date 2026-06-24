"use client";

import { Check } from "lucide-react";
import { Reveal, SectionTitle, ImagePlaceholder } from "./ui";
import { PROOF } from "@/content/landing";

export function TemplateProof() {
  return (
    <section className="bg-[color:var(--color-paper)] py-24">
      <div className="mx-auto max-w-5xl px-6">
        <Reveal className="mb-12">
          <SectionTitle eyebrow={PROOF.eyebrow} title={PROOF.title} sub={PROOF.sub} />
        </Reveal>

        <Reveal>
          <ImagePlaceholder label="Backlog dashboard preview" ratio="aspect-video" />
        </Reveal>

        <Reveal className="mt-10">
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {PROOF.bullets.map((b) => (
              <li key={b} className="flex items-start justify-center gap-2 text-center text-sm text-black/65">
                <Check className="mt-0.5 size-4 shrink-0 text-[color:var(--color-accent)]" strokeWidth={2.5} />
                {b}
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
