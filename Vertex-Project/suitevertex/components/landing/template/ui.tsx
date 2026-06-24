"use client";

import { useEffect, useRef, useState } from "react";
import { motion, animate, useInView, useReducedMotion } from "framer-motion";
import { ImageIcon, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/cn";
import { useBookCall } from "@/components/landing/cta-modal";

/* ---------- motion ---------- */

export const fadeUp = {
  hidden: { opacity: 0, y: 28 },
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

/** Hover-lift transition shared by interactive cards (transform-only, GPU-friendly). */
export const cardHover = { y: -6 } as const;
export const cardHoverTransition = { type: "spring" as const, stiffness: 300, damping: 22 };

/** Count-up number for stat metrics. Parses a leading number, keeps prefix/suffix. */
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
  // Count state starts at 0 on server + client first render (no hydration
  // mismatch). Updated only via the animation callback (async, not a sync
  // setState in the effect body).
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

/* ---------- text bits ---------- */

export function Eyebrow({ children, dark = false }: { children: React.ReactNode; dark?: boolean }) {
  return (
    <span
      className={cn(
        "inline-block rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-widest",
        dark
          ? "border-white/20 bg-white/10 text-blue-200 backdrop-blur-sm"
          : "border-blue-100 bg-blue-50 text-blue-600"
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
}: {
  eyebrow?: string;
  title: string;
  sub?: string;
  align?: "center" | "left";
}) {
  return (
    <div className={align === "center" ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}>
      {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
      <h2 className="mt-4 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl md:text-5xl">
        {title}
      </h2>
      {sub && <p className="mt-4 text-base leading-relaxed text-gray-500">{sub}</p>}
    </div>
  );
}

/* ---------- image placeholder (stands in for every image) ---------- */

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
        "relative flex w-full items-center justify-center overflow-hidden rounded-2xl border border-dashed",
        ratio,
        dark
          ? "border-white/15 bg-white/[0.04] text-white/40"
          : "border-gray-300 bg-gray-100 text-gray-400",
        className
      )}
      role="img"
      aria-label={`${label} (placeholder)`}
    >
      <div
        className="absolute inset-0 opacity-50"
        style={{
          backgroundImage:
            "repeating-linear-gradient(45deg, rgba(120,120,140,0.08) 0, rgba(120,120,140,0.08) 1px, transparent 1px, transparent 12px)",
        }}
      />
      <div className="relative flex flex-col items-center gap-2 px-4 text-center">
        <ImageIcon className="size-7" />
        <span className="text-xs font-medium">{label}</span>
      </div>
    </div>
  );
}

/* ---------- modal-triggering CTA ---------- */

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
    "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all duration-300 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/60 active:scale-95";
  const sizes = { sm: "px-5 py-2 text-xs", default: "px-7 py-3 text-sm", lg: "px-9 py-4 text-base" };
  const variants = {
    primary:
      "bg-gradient-to-r from-blue-500 to-violet-600 text-white shadow-lg shadow-violet-500/25 hover:brightness-110 hover:scale-[1.03]",
    glass: "border border-white/25 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20 hover:scale-[1.03]",
    soft: "bg-gray-100 text-gray-800 hover:bg-gray-200",
  };
  return (
    <button onClick={open} className={cn(base, sizes[size], variants[variant], className)}>
      {children}
      {variant === "primary" && <ArrowUpRight className="size-4" />}
    </button>
  );
}
