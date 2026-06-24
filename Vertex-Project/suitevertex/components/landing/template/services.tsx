"use client";

import { motion } from "framer-motion";
import { Database, Plug, Bot, LayoutPanelLeft, CheckCircle2, type LucideIcon } from "lucide-react";
import { Reveal, SectionTitle, cardHover, cardHoverTransition } from "./ui";
import { SERVICES, type ServiceGroup } from "@/content/landing";

const ICONS: Record<string, LucideIcon> = {
  database: Database,
  plug: Plug,
  bot: Bot,
  layout: LayoutPanelLeft,
};

export function TemplateServices() {
  return (
    <section id="services" className="scroll-mt-20 bg-gray-50 py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal className="mb-14">
          <SectionTitle eyebrow={SERVICES.eyebrow} title={SERVICES.title} sub={SERVICES.sub} />
        </Reveal>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {SERVICES.groups.map((group, i) => (
            <ServiceCard key={group.title} group={group} delay={i * 0.1} />
          ))}
        </div>
      </div>
    </section>
  );
}

function ServiceCard({ group, delay }: { group: ServiceGroup; delay: number }) {
  const Icon = ICONS[group.icon] ?? Database;
  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ ...cardHover, transition: cardHoverTransition }}
      className="flex flex-col rounded-3xl border border-gray-200 bg-white p-7 hover:border-gray-300 hover:shadow-xl hover:shadow-blue-100/50"
    >
      <div className="mb-5 flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 text-white">
        <Icon className="size-6" />
      </div>
      <h3 className="text-lg font-bold text-gray-900">{group.title}</h3>
      <ul className="mt-4 space-y-2.5">
        {group.items.map((item) => (
          <li key={item} className="flex items-start gap-2 text-sm text-gray-600">
            <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-blue-500" />
            {item}
          </li>
        ))}
      </ul>
    </motion.div>
  );
}
