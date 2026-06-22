import { cn } from "@/lib/cn";
import { Badge } from "./badge";
export function SectionHeading({ eyebrow, title, subtitle, align = "center" }: { eyebrow?: string; title: string; subtitle?: string; align?: "left" | "center"; }) {
  return (
    <div className={cn("max-w-2xl", align === "center" && "mx-auto text-center")}>
      {eyebrow && <Badge className="mb-4">{eyebrow}</Badge>}
      <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{title}</h2>
      {subtitle && <p className="mt-4 text-lg text-navy-800/70">{subtitle}</p>}
    </div>
  );
}
