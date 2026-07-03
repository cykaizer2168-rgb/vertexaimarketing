import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { Code2, Cloud, Boxes, BrainCircuit, ShoppingBag, ShoppingCart, Workflow, Calendar, PlayCircle, Download } from "lucide-react";
import { IconBadge } from "./Placeholder";

const ORBIT_ICONS = [
  { icon: Code2, label: "SuiteScript 2.1", pos: "top-2 left-2" },
  { icon: Cloud, label: "REST API", pos: "top-2 right-2" },
  { icon: Boxes, label: "NetSuite", pos: "top-[34%] -left-4" },
  { icon: BrainCircuit, label: "AI Agents", pos: "top-[34%] -right-4" },
  { icon: Workflow, label: "n8n", pos: "bottom-[28%] -left-6" },
  { icon: ShoppingBag, label: "Shopify", pos: "bottom-[28%] -right-6" },
  { icon: ShoppingCart, label: "WooCommerce", pos: "bottom-0 right-4" },
];

const STRIP = [
  { label: "7+ Years Experience", badge: "/badges/years.png" },
  { label: "Oracle ACS", badge: "/badges/oracle-acs.png" },
  { label: "NetSuite Certified", badge: "/badges/netsuite-certified.png" },
  { label: "AI Automation Builder", badge: "/badges/ai-automation.png" },
  { label: "REST API Integration", badge: "/badges/rest-api.png" },
  { label: "n8n Automation", badge: "/badges/n8n.png" },
];

export default function Hero() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const yOrbit = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const yText = useTransform(scrollYProgress, [0, 1], [0, -60]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0.2]);

  return (
    <section id="home" ref={ref} className="relative pt-32 pb-16 lg:pt-40 overflow-hidden bg-grid-glow">
      {/* Background image */}
      <div
        aria-hidden
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/bg.jpg')" }}
      />
      {/* Legibility overlay — darker on the left where the headline sits */}
      <div className="absolute inset-0 bg-gradient-to-r from-ink/95 via-ink/78 to-ink/30" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-10 grid lg:grid-cols-2 gap-12 items-center">
        {/* Left: copy */}
        <motion.div style={{ y: yText, opacity }}>
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="font-mono text-[11px] tracking-[0.2em] uppercase text-amber border border-amber/30 rounded-full px-3 py-1"
          >
            Senior NetSuite ERP Consultant
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="font-display font-bold text-4xl sm:text-5xl leading-[1.1] mt-5"
          >
            Helping Companies Build{" "}
            <span className="text-cyan">Smarter ERP Systems</span> with{" "}
            <span className="text-amber">AI Automation.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="text-mist mt-5 max-w-lg leading-relaxed"
          >
            Senior Principal Consultant · NetSuite Expert · AI Automation Architect.
            7+ years delivering end-to-end NetSuite ERP solutions, eCommerce
            integrations, and AI automation that drive efficiency, scalability,
            and business growth.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="flex flex-wrap gap-4 mt-8"
          >
            <a href="#contact" className="inline-flex items-center gap-2 bg-cyan text-ink font-semibold text-sm px-5 py-3 rounded-lg hover:bg-cyan/90 transition-colors">
              <Calendar size={16} /> Get in Touch
            </a>
            <a href="/Angelo-Franco-Resume.pdf" download className="inline-flex items-center gap-2 bg-amber/90 text-ink font-semibold text-sm px-5 py-3 rounded-lg hover:bg-amber transition-colors">
              <Download size={16} /> Download CV
            </a>
            <a href="#projects" className="inline-flex items-center gap-2 border border-line text-white font-medium text-sm px-5 py-3 rounded-lg hover:bg-panel transition-colors">
              <PlayCircle size={16} /> View Case Studies
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="flex flex-wrap gap-3 mt-9 pt-6 border-t border-line/70"
          >
            {STRIP.map((s) => (
              <span key={s.label} className="inline-flex items-center gap-2 font-mono text-[11px] text-mist bg-ink/70 border border-line rounded-full pl-1.5 pr-3.5 py-1">
                <img src={s.badge} alt="" className="h-7 w-7 object-contain shrink-0" />
                {s.label}
              </span>
            ))}
          </motion.div>
        </motion.div>

        {/* Right: portrait + orbit icons, parallax */}
        <motion.div style={{ y: yOrbit }} className="relative mx-auto w-full max-w-md aspect-square">
          <div className="absolute inset-0 rounded-full border border-cyan/20" />
          <div className="absolute inset-6 rounded-full border border-cyan/10" />
          <div className="absolute inset-0 rounded-full bg-cyan/5 blur-3xl" />

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7 }}
            className="absolute inset-8"
          >
            <img
              src="/portrait.jpg"
              alt="Angelo B. Franco"
              className="w-full h-full rounded-full object-cover object-top border border-cyan/25 shadow-[0_0_60px_rgba(61,169,252,0.20)]"
            />
          </motion.div>

          {ORBIT_ICONS.map(({ icon, label, pos }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 + i * 0.08, duration: 0.4 }}
              whileHover={{ scale: 1.08 }}
              className={`absolute ${pos}`}
            >
              <IconBadge icon={icon} label={label} accent={i % 4 === 0 ? "amber" : "cyan"} />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
