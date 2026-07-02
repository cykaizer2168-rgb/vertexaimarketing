import { motion } from "framer-motion";
import { Building2 } from "lucide-react";

const JOURNEY = [
  { company: "Oracle Philippines (ACS Division)", role: "Senior Principal Consultant", date: "Nov 2024 — Present" },
  { company: "FORTE Consulting", role: "Sr. NetSuite Functional Consultant", date: "Jan 2024 — Sep 2024" },
  { company: "Threadgold Consulting", role: "Sr. NetSuite Functional Consultant", date: "Mar 2023 — Feb 2024" },
  { company: "CloudTech Philippines", role: "NetSuite Project Manager", date: "Nov 2021 — Mar 2023" },
  { company: "ABJ Cloud Solutions", role: "Functional Consultant", date: "Nov 2020 — Oct 2021" },
  { company: "Mustard Seed Systems Corp.", role: "Functional Consultant", date: "Oct 2018 — Nov 2020" },
];

export default function Journey() {
  return (
    <section id="experience" className="max-w-7xl mx-auto px-6 lg:px-10 py-24">
      <div className="text-center mb-16">
        <span className="font-mono text-[11px] tracking-[0.2em] uppercase text-cyan">Professional Experience</span>
        <h2 className="font-display font-bold text-3xl sm:text-4xl mt-3">
          My <span className="text-cyan">Journey</span>
        </h2>
      </div>

      <div className="relative">
        <div className="hidden lg:block absolute top-7 left-0 right-0 h-px bg-line" />
        <motion.div
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.2, ease: "easeInOut" }}
          style={{ transformOrigin: "left" }}
          className="hidden lg:block absolute top-7 left-0 right-0 h-px bg-gradient-to-r from-cyan via-amber to-cyan"
        />

        <div className="grid lg:grid-cols-6 gap-10 lg:gap-6">
          {JOURNEY.map((j, i) => (
            <motion.div
              key={j.company}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              whileHover={{ y: -6, transition: { type: "spring", stiffness: 300, damping: 18 } }}
              className="text-center flex flex-col items-center group cursor-default"
            >
              <span
                className={`relative z-10 flex items-center justify-center w-14 h-14 rounded-full border-2 mb-4 bg-ink transition-all group-hover:scale-110 group-hover:shadow-[0_0_28px_rgba(61,169,252,0.35)] ${
                  i === 0 ? "border-amber text-amber" : "border-line text-mist group-hover:border-cyan group-hover:text-cyan"
                }`}
              >
                <Building2 size={20} strokeWidth={1.75} />
              </span>
              <p className="font-display font-semibold text-sm leading-snug">{j.company}</p>
              <p className="text-xs text-mist mt-1.5">{j.role}</p>
              <p className="text-[11px] font-mono text-cyan/80 mt-1">{j.date}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
