import { motion } from "framer-motion";
import { Factory, Building, Landmark, HardHat, Boxes, Sun, ShoppingBag, Quote, Calendar, Linkedin, Mail, Globe } from "lucide-react";
import { cardHover } from "../lib/cardHover";

const INDUSTRIES = [
  { icon: Factory, label: "Manufacturing" },
  { icon: Building, label: "Real Estate" },
  { icon: Landmark, label: "Financial Services" },
  { icon: HardHat, label: "Construction" },
  { icon: Boxes, label: "Supply Chain & Logistics" },
  { icon: Sun, label: "Renewable Energy" },
];

const STATS = [
  { value: "40+", label: "Projects Delivered" },
  { value: "7+", label: "Years of Experience" },
  { value: "15+", label: "Industries Served" },
  { value: "100%", label: "Client Focus" },
];

export function ProofStrip() {
  return (
    <section className="max-w-7xl mx-auto px-6 lg:px-10 pb-24 grid lg:grid-cols-3 gap-6">
      <motion.div
        whileHover={cardHover}
        className="bg-panel border border-line rounded-2xl p-7 transition-colors hover:border-cyan/45"
      >
        <span className="font-mono text-[11px] tracking-[0.2em] uppercase text-cyan">Industries Served</span>
        <ul className="grid grid-cols-2 gap-3 mt-5">
          {INDUSTRIES.map((it) => (
            <li key={it.label} className="flex items-center gap-2.5 text-sm text-mist">
              <it.icon size={16} className="text-cyan shrink-0" /> {it.label}
            </li>
          ))}
        </ul>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.5 }}
        transition={{ duration: 0.5 }}
        whileHover={cardHover}
        className="bg-panel border border-line rounded-2xl p-7 flex flex-col transition-colors hover:border-cyan/45"
      >
        <span className="font-mono text-[11px] tracking-[0.2em] uppercase text-cyan mb-4">Client Testimonials</span>
        <Quote className="text-amber mb-3" size={26} />
        <p className="text-sm text-mist leading-relaxed flex-1">
          "Angelo quickly understood our business process and delivered an
          elegant NetSuite solution that streamlined our operations and
          improved our reporting significantly."
        </p>
        <div className="flex items-center gap-2 mt-5">
          <div className="placeholder-img w-9 h-9 rounded-full" />
          <div>
            <p className="text-xs text-amber">★★★★★</p>
            <p className="text-[11px] text-mist">— Manufacturing Client | USA</p>
          </div>
        </div>
      </motion.div>

      <motion.div
        whileHover={cardHover}
        className="bg-panel border border-line rounded-2xl p-7 transition-colors hover:border-cyan/45"
      >
        <span className="font-mono text-[11px] tracking-[0.2em] uppercase text-cyan">By The Numbers</span>
        <div className="grid grid-cols-2 gap-y-6 mt-5">
          {STATS.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ delay: i * 0.08, duration: 0.4 }}
            >
              <p className="font-display font-bold text-2xl text-amber">{s.value}</p>
              <p className="text-xs text-mist">{s.label}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}

export function CTA() {
  return (
    <section id="contact" className="max-w-7xl mx-auto px-6 lg:px-10 pb-20">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.6 }}
        whileHover={{ y: -4, boxShadow: "0 26px 60px -24px rgba(61,169,252,0.32)", transition: { type: "spring", stiffness: 280, damping: 20 } }}
        className="bg-gradient-to-br from-panel to-panel2 border border-line rounded-3xl px-8 py-12 lg:px-14 flex flex-col lg:flex-row items-center justify-between gap-8 transition-colors hover:border-cyan/45"
      >
        <div>
          <h2 className="font-display font-bold text-2xl sm:text-3xl">
            Let's Build Your Next <span className="text-cyan">Enterprise Solution.</span>
          </h2>
          <p className="text-mist mt-3 max-w-md">
            Need NetSuite implementation? AI automation? System integration?
            Let's discuss how I can help your business grow and scale.
          </p>
        </div>
        <div className="flex flex-col items-center gap-2 shrink-0">
          <a href="mailto:angelo.franco2168@gmail.com?subject=NetSuite%2FAI%20Automation%20Opportunity" className="inline-flex items-center gap-2 bg-cyan text-ink font-semibold text-sm px-6 py-3.5 rounded-lg hover:bg-cyan/90 transition-colors">
            <Calendar size={16} /> Book a Free Consultation
          </a>
          <span className="text-[11px] text-mist">No obligation. Just a friendly conversation.</span>
        </div>
      </motion.div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-line bg-panel/40">
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
        <div>
          <p className="font-display font-semibold text-lg">ANGELO B. FRANCO</p>
          <p className="text-xs text-mist mt-1">Senior NetSuite ERP Consultant</p>
          <p className="text-xs text-mist">AI Automation Expert</p>
        </div>
        <div className="text-sm text-mist space-y-2">
          <a href="mailto:angelo.franco2168@gmail.com" className="flex items-center gap-2 hover:text-cyan transition-colors"><Mail size={14} /> angelo.franco2168@gmail.com</a>
          <a href="https://linkedin.com/in/kaizer2168" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-cyan transition-colors"><Linkedin size={14} /> linkedin.com/in/kaizer2168</a>
          <p className="flex items-center gap-2"><Globe size={14} /> Bulacan, Philippines</p>
        </div>
        <div className="text-sm text-mist space-y-2">
          <p className="text-white font-medium mb-2">Quick Links</p>
          <a href="/#services" className="block hover:text-cyan transition-colors">Services</a>
          <a href="/#projects" className="block hover:text-cyan transition-colors">Projects</a>
          <a href="/blog" className="block hover:text-cyan transition-colors">Blog</a>
          <a href="/about" className="block hover:text-cyan transition-colors">About</a>
        </div>
        <div className="text-sm text-mist space-y-2">
          <p className="text-white font-medium mb-2">Resources</p>
          <a href="/Angelo-Franco-Resume.pdf" download className="block hover:text-cyan transition-colors">Download CV</a>
          <a href="/contact" className="block hover:text-cyan transition-colors">Contact</a>
          <a href="/privacy" className="block hover:text-cyan transition-colors">Privacy Policy</a>
          <a href="https://linkedin.com/in/kaizer2168" target="_blank" rel="noopener noreferrer" className="block hover:text-cyan transition-colors">LinkedIn</a>
        </div>
      </div>
      <div className="border-t border-line py-5 text-center text-[11px] text-mist">
        © {new Date().getFullYear()} Angelo B. Franco. All rights reserved.
      </div>
    </footer>
  );
}
