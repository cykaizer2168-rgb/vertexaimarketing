"use client";
import { useState } from "react";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";
import type { Faq as FaqType } from "@/sanity/lib/types";

export function Faq({ items }: { items: FaqType[] }) {
  const [open, setOpen] = useState<string | null>(null);
  if (!items.length) return null;
  return (
    <section className="py-20">
      <Container className="max-w-3xl">
        <SectionHeading title="Questions, answered" />
        <div className="mt-10 divide-y divide-navy-800/10">
          {items.map((f) => (
            <div key={f._id} className="py-4">
              <button onClick={() => setOpen(open === f._id ? null : f._id)} className="flex w-full items-center justify-between text-left font-medium" aria-expanded={open === f._id}>
                {f.question}
                <ChevronDown className={cn("size-5 transition-transform", open === f._id && "rotate-180")} />
              </button>
              {open === f._id && <p className="mt-3 text-sm text-navy-800/70">{f.answer}</p>}
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
