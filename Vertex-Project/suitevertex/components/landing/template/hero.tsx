"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { CheckCircle2, ImageIcon } from "lucide-react";
import { fadeUp, BookButton } from "./ui";
import { HERO, TRUST } from "@/content/landing";

export function TemplateHero() {
  return (
    <section id="top" className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#070a14]">
      {/* video background */}
      <video
        className="absolute inset-0 h-full w-full scale-105 object-cover"
        src="/hero-bg.mp4"
        autoPlay
        loop
        muted
        playsInline
        aria-hidden="true"
      />

      {/* overlays */}
      <div
        className="absolute inset-0"
        style={{ background: "linear-gradient(to bottom,rgba(7,10,20,.82) 0%,rgba(7,10,20,.6) 45%,rgba(7,10,20,.92) 100%)" }}
        aria-hidden
      />
      <div
        className="absolute inset-0 opacity-[0.12]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.06) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.06) 1px,transparent 1px)",
          backgroundSize: "64px 64px",
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(ellipse 80% 50% at 50% -10%,rgba(99,102,241,.22) 0%,transparent 70%)" }}
        aria-hidden
      />

      <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-col items-center px-4 py-28 text-center sm:px-6">
        <motion.div
          variants={fadeUp}
          custom={0}
          initial="hidden"
          animate="visible"
          className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-medium tracking-wide text-white/90 backdrop-blur-md sm:text-sm"
        >
          <span className="size-1.5 rounded-full bg-blue-400" />
          {HERO.eyebrow}
        </motion.div>

        <motion.h1
          variants={fadeUp}
          custom={0.15}
          initial="hidden"
          animate="visible"
          className="mb-5 text-4xl font-extrabold leading-[1.08] tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl"
        >
          {HERO.headlineTop}<br />
          <span
            className="bg-clip-text text-transparent"
            style={{ backgroundImage: "linear-gradient(90deg,#60a5fa 0%,#818cf8 50%,#a78bfa 100%)" }}
          >
            {HERO.headlineAccent}
          </span>
        </motion.h1>

        <motion.p
          variants={fadeUp}
          custom={0.3}
          initial="hidden"
          animate="visible"
          className="mx-auto mb-8 max-w-2xl text-base leading-relaxed text-white/65 sm:text-lg md:text-xl"
        >
          {HERO.sub}
        </motion.p>

        <motion.div
          variants={fadeUp}
          custom={0.4}
          initial="hidden"
          animate="visible"
          className="mb-10 flex flex-wrap justify-center gap-2"
        >
          {HERO.badges.map((b) => (
            <span
              key={b}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium text-white/80 backdrop-blur-sm"
            >
              <CheckCircle2 className="size-3 text-blue-400" />
              {b}
            </span>
          ))}
        </motion.div>

        <motion.div
          variants={fadeUp}
          custom={0.5}
          initial="hidden"
          animate="visible"
          className="mb-16 flex flex-col justify-center gap-3 sm:flex-row"
        >
          <BookButton size="lg">{HERO.primaryCta}</BookButton>
          <a href="#pricing">
            <span className="inline-flex items-center justify-center gap-2 rounded-full border border-white/25 bg-white/10 px-9 py-4 text-base font-semibold text-white backdrop-blur-sm transition-all hover:scale-[1.03] hover:bg-white/20">
              {HERO.secondaryCta}
            </span>
          </a>
        </motion.div>

        {/* Trust bar */}
        <motion.div variants={fadeUp} custom={0.65} initial="hidden" animate="visible" className="w-full">
          <p className="mb-5 text-center text-xs font-semibold uppercase tracking-widest text-white/40">
            {TRUST.label}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
            {TRUST.items.map((item) =>
              item.logo ? (
                <span key={item.name} className="relative block h-9 w-28 overflow-hidden">
                  <Image
                    src={item.logo}
                    alt={item.name}
                    fill
                    sizes="112px"
                    className="object-cover object-center mix-blend-screen"
                  />
                </span>
              ) : (
                <div key={item.name} className="flex items-center gap-2 text-white/55">
                  {/* logo image placeholder */}
                  <span className="grid size-7 place-items-center rounded-md border border-dashed border-white/20 bg-white/[0.04]">
                    <ImageIcon className="size-3.5" />
                  </span>
                  <span className="text-sm font-bold tracking-tight text-white/70">{item.name}</span>
                </div>
              )
            )}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
