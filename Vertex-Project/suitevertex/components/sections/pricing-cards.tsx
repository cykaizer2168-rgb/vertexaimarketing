import { Container } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { Check } from "lucide-react";
import type { PricingPlan } from "@/sanity/lib/types";

export function PricingCards({ plans }: { plans: PricingPlan[] }) {
  if (!plans.length) return null;
  return (
    <section className="py-20" id="pricing">
      <Container className="grid gap-6 md:grid-cols-3">
        {plans.map((p) => (
          <Card key={p._id} className={cn(p.featured && "ring-2 ring-indigo-600")}>
            {p.featured && <Badge className="mb-4">Most popular</Badge>}
            <h3 className="text-xl font-semibold">{p.name}</h3>
            {p.bestFor && <p className="mt-1 text-sm text-navy-800/60">{p.bestFor}</p>}
            <p className="mt-4 text-4xl font-bold">{p.price}<span className="text-base font-normal text-navy-800/50">{p.cadence === "/mo" ? "/mo" : ""}</span></p>
            <ul className="mt-6 space-y-2 text-sm">
              {(p.features ?? []).map((f, i) => (
                <li key={`${f}-${i}`} className="flex gap-2"><Check className="size-4 shrink-0 text-teal-500" />{f}</li>
              ))}
            </ul>
            <ButtonLink href="/contact" className="mt-6 w-full" variant={p.featured ? "primary" : "outline"}>{p.ctaLabel ?? "Book intro call"}</ButtonLink>
          </Card>
        ))}
      </Container>
    </section>
  );
}
