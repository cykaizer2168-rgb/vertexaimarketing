"use client";

import { useEffect, useRef, useState } from "react";
import { motion, animate, useInView, useReducedMotion } from "framer-motion";
import { ImageIcon } from "lucide-react";
import { cn } from "@/lib/cn";
import { useBookCall } from "@/components/landing/cta-modal";

/* ---------- motion ---------- */

export const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
};

export function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      variants={fadeUp}
      custom={delay}
      initial={reduced ? false : "hidden"}
      whileInView={reduced ? undefined : "visible"}
      viewport={{ once: true, margin: "-80px" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* Kept for compatibility; editorial cards mostly use border/bg hover instead. */
export const cardHover = { y: -4 } as const;
export const cardHoverTransition = { type: "spring" as const, stiffness: 300, damping: 24 };

/* ---------- editorial text bits ---------- */

export function Eyebrow({
  children,
  dark = false,
  className = "",
}: {
  children: React.ReactNode;
  dark?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "font-mono text-[11px] uppercase tracking-[0.22em]",
        dark ? "text-white/55" : "text-[color:var(--color-accent)]",
        className
      )}
    >
      {children}
    </span>
  );
}

export function SectionTitle({
  eyebrow,
  title,
  sub,
  align = "center",
  dark = false,
}: {
  eyebrow?: string;
  title: string;
  sub?: string;
  align?: "center" | "left";
  dark?: boolean;
}) {
  return (
    <div className={align === "center" ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}>
      {eyebrow && <Eyebrow dark={dark}>{eyebrow}</Eyebrow>}
      <h2
        className={cn(
          "mt-4 font-display text-3xl font-semibold tracking-[-0.02em] sm:text-4xl md:text-5xl",
          dark ? "text-white" : "text-[color:var(--color-ink)]"
        )}
      >
        {title}
      </h2>
      {sub && (
        <p className={cn("mt-4 text-base leading-relaxed", dark ? "text-white/60" : "text-black/55")}>
          {sub}
        </p>
      )}
    </div>
  );
}

/* ---------- image placeholder ---------- */

export function ImagePlaceholder({
  label,
  className = "",
  ratio = "aspect-video",
  dark = false,
}: {
  label: string;
  className?: string;
  ratio?: string;
  dark?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative flex w-full items-center justify-center overflow-hidden rounded-2xl",
        ratio,
        dark ? "bg-white/[0.05] text-white/40" : "bg-black/[0.04] text-black/35",
        className
      )}
      role="img"
      aria-label={`${label} (placeholder)`}
    >
      <div className="relative flex flex-col items-center gap-2 px-4 text-center">
        <ImageIcon className="size-7" />
        <span className="font-mono text-[11px] uppercase tracking-widest">{label}</span>
      </div>
    </div>
  );
}

/* ---------- modal-triggering CTA (flat, editorial) ---------- */

export function BookButton({
  children = "Book a 15-min call",
  variant = "primary",
  size = "default",
  className = "",
}: {
  children?: React.ReactNode;
  variant?: "primary" | "glass" | "soft";
  size?: "default" | "lg" | "sm";
  className?: string;
}) {
  const { open } = useBookCall();
  const base =
    "inline-flex items-center justify-center gap-2 rounded-md font-semibold transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-accent)]/50";
  const sizes = { sm: "px-4 py-2 text-xs", default: "px-6 py-3 text-sm", lg: "px-7 py-3.5 text-sm" };
  const variants = {
    primary: "bg-[color:var(--color-accent)] text-white hover:opacity-90",
    glass: "border border-white/25 text-white hover:bg-white/10",
    soft: "border border-black/15 text-[color:var(--color-ink)] hover:bg-black/[0.04]",
  };
  return (
    <button onClick={open} className={cn(base, sizes[size], variants[variant], className)}>
      {children}
    </button>
  );
}

/* ---------- count-up stat ---------- */

export function CountUp({ value, className = "" }: { value: string; className?: string }) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const match = /^(\D*?)(\d[\d,]*(?:\.\d+)?)(.*)$/.exec(value);
  const prefix = match?.[1] ?? "";
  const numStr = match?.[2] ?? "";
  const suffix = match?.[3] ?? "";
  const target = numStr ? parseFloat(numStr.replace(/,/g, "")) : 0;
  const decimals = numStr.includes(".") ? numStr.split(".")[1].length : 0;
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!match || reduced || !inView) return;
    const controls = animate(0, target, {
      duration: 1.2,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setCount(v),
    });
    return () => controls.stop();
  }, [inView, reduced, match, target]);

  if (!match) {
    return (
      <span ref={ref} className={className}>
        {value}
      </span>
    );
  }
  const shown = reduced ? target : count;
  return (
    <span ref={ref} className={className}>
      {prefix}
      {shown.toFixed(decimals)}
      {suffix}
    </span>
  );
}
