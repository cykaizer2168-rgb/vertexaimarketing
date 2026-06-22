import { cn } from "@/lib/cn";
export function Badge({ className, children }: { className?: string; children: React.ReactNode }) {
  return <span className={cn("inline-flex items-center rounded-full bg-teal-500/10 px-3 py-1 text-xs font-medium text-teal-600", className)}>{children}</span>;
}
