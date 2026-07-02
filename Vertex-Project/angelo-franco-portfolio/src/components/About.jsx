import { motion } from "framer-motion";
import { Clock, Award, Layers, Factory, DollarSign, Truck, Cpu, Globe2 } from "lucide-react";
import { cardHover } from "../lib/cardHover";

const FACTS = [
  { icon: Clock, label: "7+ Years", sub: "NetSuite Experience" },
  { icon: Award, label: "Oracle ACS", sub: "Senior Consultant" },
  { icon: Layers, label: "40+ Projects", sub: "Successful Projects" },
  { icon: Factory, label: "Manufacturing", sub: "Domain Expert" },
  { icon: DollarSign, label: "Financial &", sub: "Controlling" },
  { icon: Truck, label: "Supply Chain", sub: "& Inventory" },
  { icon: Cpu, label: "AI Automation", sub: "Specialist" },
  { icon: Globe2, label: "Global", sub: "Clientele" },
];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.5 } }),
};

export default function About() {
  return (
    <section id="about" className="max-w-7xl mx-auto px-6 lg:px-10 py-24 grid lg:grid-cols-2 gap-12 items-start">
      <motion.div
        initial={{ opacity: 0, x: -30 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.6 }}
      >
        <img
          src="/portrait.jpg"
          alt="Angelo B. Franco"
          className="w-full aspect-[4/5] object-cover object-top rounded-2xl border border-line"
        />
      </motion.div>

      <div>
        <span className="font-mono text-[11px] tracking-[0.2em] uppercase text-cyan">About Me</span>
        <h2 className="font-display font-bold text-3xl sm:text-4xl mt-3">
          Who <span className="text-cyan">I Am</span>
        </h2>
        <p className="text-mist mt-4 leading-relaxed max-w-lg">
          I partner with businesses to design, implement, and optimize NetSuite
          ERP systems and automate operations using AI and modern technologies.
        </p>

        <div className="grid grid-cols-2 gap-4 mt-9">
          {FACTS.map((f, i) => (
            <motion.div
              key={f.label}
              custom={i}
              variants={fadeUp}
              initial="hidden"
              whileInView="show"
              whileHover={cardHover}
              viewport={{ once: true, amount: 0.4 }}
              className="flex items-center gap-3 bg-panel border border-line rounded-xl px-4 py-3.5 transition-colors hover:border-cyan/45"
            >
              <span className="text-cyan shrink-0"><f.icon size={20} strokeWidth={1.75} /></span>
              <div className="leading-tight">
                <p className="text-sm font-semibold text-white">{f.label}</p>
                <p className="text-xs text-mist">{f.sub}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
