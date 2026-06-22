import { Container } from "@/components/ui/container";
import type { Stat } from "@/sanity/lib/types";

export function Stats({ items }: { items: Stat[] }) {
  if (!items.length) return null;
  return (
    <section className="border-y border-navy-800/10 bg-white">
      <Container className="grid grid-cols-2 gap-8 py-12 md:grid-cols-4">
        {items.map((s) => (
          <div key={s._id} className="text-center">
            <p className="text-3xl font-bold text-indigo-600">{s.value}</p>
            <p className="mt-1 text-sm text-navy-800/60">{s.label}</p>
          </div>
        ))}
      </Container>
    </section>
  );
}
