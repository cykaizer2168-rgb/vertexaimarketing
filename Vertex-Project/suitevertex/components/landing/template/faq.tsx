"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Reveal, SectionTitle } from "./ui";
import { cn } from "@/lib/cn";
import { FAQS } from "@/content/landing";

export function TemplateFaq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="scroll-mt-20 bg-white py-24">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <Reveal className="mb-12">
          <SectionTitle eyebrow="FAQ" title="Questions, answered." />
        </Reveal>

        <div className="space-y-3">
          {FAQS.map((faq, i) => {
            const isOpen = open === i;
            return (
              <Reveal key={faq.q} delay={i * 0.05}>
                <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
                  <button
                    onClick={() => setOpen(isOpen ? null : i)}
                    aria-expanded={isOpen}
                    className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
                  >
                    <span className="text-base font-semibold text-gray-900">{faq.q}</span>
                    <ChevronDown
                      className={cn("size-5 shrink-0 text-blue-500 transition-transform", isOpen && "rotate-180")}
                    />
                  </button>
                  {isOpen && <p className="px-6 pb-5 text-sm leading-relaxed text-gray-500">{faq.a}</p>}
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
