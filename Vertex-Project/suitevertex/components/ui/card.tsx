import { cn } from "@/lib/cn";
export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("rounded-2xl border border-navy-800/10 bg-white p-6 shadow-sm", className)}>{children}</div>;
}
