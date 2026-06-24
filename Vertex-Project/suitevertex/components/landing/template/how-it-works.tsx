"use client";

import { motion } from "framer-motion";
import { Reveal, SectionTitle } from "./ui";
import { STEPS } from "@/content/landing";

export function TemplateHowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-20 bg-white py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal className="mb-14">
          <SectionTitle eyebrow={STEPS.eyebrow} title={STEPS.title} sub={STEPS.sub} />
        </Reveal>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.items.map((step, i) => (
            <motion.div
              key={step.n}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="relative rounded-3xl border border-gray-200 bg-gray-50 p-7 transition-all duration-300 hover:border-blue-200 hover:bg-white hover:shadow-lg"
            >
              <span className="font-display text-4xl font-extrabold text-indigo-600">{step.n}</span>
              <h3 className="mt-3 text-lg font-bold text-gray-900">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-500">{step.body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
