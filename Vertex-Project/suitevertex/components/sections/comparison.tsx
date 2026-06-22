import { Container } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/ui/section-heading";
import type { Comparison as ComparisonType } from "@/sanity/lib/types";

export function Comparison({ items }: { items: ComparisonType[] }) {
  if (!items.length) return null;
  return (
    <section className="bg-navy-950 py-20 text-white">
      <Container>
        <SectionHeading eyebrow="The alternatives" title="How most teams handle this today" subtitle="The usual options are expensive, slow, or risky." />
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {items.map((c) => (
            <Card key={c._id} className="border-white/10 bg-navy-900 text-white">
              <p className="text-sm font-medium text-teal-400">{c.optionLabel}</p>
              <h3 className="mt-2 text-lg font-semibold">{c.title}</h3>
              {c.body && <p className="mt-2 text-sm text-white/60">{c.body}</p>}
              {c.costNote && <p className="mt-4 text-sm font-medium">{c.costNote}</p>}
            </Card>
          ))}
        </div>
      </Container>
    </section>
  );
}
