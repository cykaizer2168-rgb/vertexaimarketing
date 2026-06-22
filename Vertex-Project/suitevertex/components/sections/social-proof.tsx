import { Container } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import type { Testimonial } from "@/sanity/lib/types";

export function SocialProof({ items }: { items: Testimonial[] }) {
  if (!items.length) return null;
  return (
    <section className="bg-white py-20">
      <Container className="grid gap-6 md:grid-cols-2">
        {items.map((t) => (
          <Card key={t._id}>
            <p className="text-lg">"{t.quote}"</p>
            <p className="mt-4 text-sm font-medium">{t.name}{t.role ? `, ${t.role}` : ""}{t.company ? ` · ${t.company}` : ""}</p>
          </Card>
        ))}
      </Container>
    </section>
  );
}
