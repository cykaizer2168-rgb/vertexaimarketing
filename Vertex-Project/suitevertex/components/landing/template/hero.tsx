"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { fadeUp, BookButton } from "./ui";
import { HERO, TRUST } from "@/content/landing";

export function TemplateHero() {
  return (
    <section
      id="top"
      className="relative flex min-h-[92vh] flex-col justify-end overflow-hidden bg-[color:var(--color-ink)]"
    >
      <video
        className="absolute inset-0 h-full w-full object-cover opacity-55"
        src="/hero-bg.mp4"
        autoPlay
        loop
        muted
        playsInline
        aria-hidden="true"
      />
      <div className="absolute inset-0 bg-[linear-gradient(to_top,#0a0b0d_6%,rgba(10,11,13,0.5)_55%,rgba(10,11,13,0.72)_100%)]" />

      {/* content — left aligned, editorial */}
      <div className="relative z-10 mx-auto w-full max-w-6xl px-6 pt-28">
        <motion.p
          variants={fadeUp}
          custom={0}
          initial="hidden"
          animate="visible"
          className="mb-6 font-mono text-[11px] uppercase tracking-[0.25em] text-white/55"
        >
          {HERO.eyebrow}
        </motion.p>

        <motion.h1
          variants={fadeUp}
          custom={0.1}
          initial="hidden"
          animate="visible"
          className="max-w-4xl font-display text-5xl font-semibold leading-[0.98] tracking-[-0.02em] text-white sm:text-6xl md:text-7xl"
        >
          {HERO.headlineTop}
          <br />
          <span className="text-[color:var(--color-accent)]">{HERO.headlineAccent}</span>
        </motion.h1>

        <motion.p
          variants={fadeUp}
          custom={0.2}
          initial="hidden"
          animate="visible"
          className="mt-6 max-w-xl text-lg leading-relaxed text-white/65"
        >
          {HERO.sub}
        </motion.p>

        <motion.div
          variants={fadeUp}
          custom={0.3}
          initial="hidden"
          animate="visible"
          className="mt-9 flex flex-wrap items-center gap-3"
        >
          <BookButton size="lg">{HERO.primaryCta}</BookButton>
          <a
            href="#services"
            className="inline-flex items-center justify-center rounded-md border border-white/25 px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            {HERO.secondaryCta} →
          </a>
        </motion.div>

        {/* spec row */}
        <motion.div
          variants={fadeUp}
          custom={0.4}
          initial="hidden"
          animate="visible"
          className="mt-12 flex flex-wrap gap-x-6 gap-y-2"
        >
          {HERO.badges.map((b) => (
            <span key={b} className="font-mono text-[11px] uppercase tracking-[0.18em] text-white/55">
              <span className="text-[color:var(--color-accent)]">—</span> {b}
            </span>
          ))}
        </motion.div>
      </div>

      {/* trust strip — real logos, blended on dark */}
      <div className="relative z-10">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-8 gap-y-3 px-6 pb-8 pt-8">
          <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/35">{TRUST.label}</span>
          {TRUST.items.map((item) =>
            item.logo ? (
              <span key={item.name} className="relative block h-7 w-24 overflow-hidden">
                <Image
                  src={item.logo}
                  alt={item.name}
                  fill
                  sizes="96px"
                  className="object-cover object-center opacity-80 mix-blend-screen"
                />
              </span>
            ) : (
              <span key={item.name} className="font-mono text-[11px] uppercase tracking-[0.15em] text-white/60">
                {item.name}
              </span>
            )
          )}
        </div>
      </div>
    </section>
  );
}
