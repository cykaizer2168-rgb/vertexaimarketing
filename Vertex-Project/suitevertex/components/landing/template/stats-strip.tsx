"use client";

import { motion } from "framer-motion";
import { Award, Workflow, Layers, Clock, type LucideIcon } from "lucide-react";
import { STATS } from "@/content/landing";

const ICONS: LucideIcon[] = [Award, Workflow, Layers, Clock];

export function TemplateStatsStrip() {
  return (
    <section className="border-y border-gray-100 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-6 md:grid-cols-4 md:gap-0 md:divide-x md:divide-gray-100">
          {STATS.map((s, i) => {
            const Icon = ICONS[i] ?? Award;
            return (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="flex flex-col items-center gap-2 px-4 text-center"
              >
                <div className="mb-1 flex size-10 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-600">
                  <Icon className="size-5" />
                </div>
                <span className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">{s.value}</span>
                <span className="text-xs uppercase tracking-widest text-gray-400">{s.label}</span>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
