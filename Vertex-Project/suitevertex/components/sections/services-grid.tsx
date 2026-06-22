import { Container } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/ui/section-heading";
import type { Service } from "@/sanity/lib/types";

export function ServicesGrid({ items }: { items: Service[] }) {
  if (!items.length) return null;
  return (
    <section className="py-20">
      <Container>
        <SectionHeading eyebrow="What's included" title="One team, senior eyes on everything" subtitle="Everything your NetSuite operation needs, on a predictable monthly plan." />
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {items.map((s) => (
            <Card key={s._id}>
              <h3 className="text-lg font-semibold">{s.title}</h3>
              {s.description && <p className="mt-2 text-sm text-navy-800/70">{s.description}</p>}
            </Card>
          ))}
        </div>
      </Container>
    </section>
  );
}
