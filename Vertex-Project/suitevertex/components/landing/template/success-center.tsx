"use client";

import { motion } from "framer-motion";
import { Ticket, BookOpen, Activity, Library, GraduationCap, type LucideIcon } from "lucide-react";
import { Reveal, SectionTitle, cardHover, cardHoverTransition } from "./ui";
import { SUCCESS_CENTER, type SuccessModule } from "@/content/landing";

const ICONS: Record<string, LucideIcon> = {
  ticket: Ticket,
  book: BookOpen,
  activity: Activity,
  library: Library,
  graduation: GraduationCap,
};

export function TemplateSuccessCenter() {
  return (
    <section id="success-center" className="scroll-mt-20 bg-gray-50 py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal className="mb-14">
          <SectionTitle
            eyebrow={SUCCESS_CENTER.eyebrow}
            title={SUCCESS_CENTER.title}
            sub={SUCCESS_CENTER.sub}
          />
        </Reveal>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
          {SUCCESS_CENTER.modules.map((m, i) => (
            <ModuleCard key={m.title} module={m} delay={i * 0.08} />
          ))}
        </div>
      </div>
    </section>
  );
}

function ModuleCard({ module, delay }: { module: SuccessModule; delay: number }) {
  const Icon = ICONS[module.icon] ?? Ticket;
  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ ...cardHover, transition: cardHoverTransition }}
      className="flex flex-col rounded-3xl border border-gray-200 bg-white p-6 hover:border-blue-200 hover:shadow-lg"
    >
      <span className="mb-4 grid size-11 place-items-center rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 text-white">
        <Icon className="size-5" />
      </span>
      <h3 className="text-base font-bold text-gray-900">{module.title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-gray-500">{module.desc}</p>
    </motion.div>
  );
}
