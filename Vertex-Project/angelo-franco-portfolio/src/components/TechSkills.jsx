import { motion } from "framer-motion";
import { cardHover } from "../lib/cardHover";

const SKILLS = [
  { name: "NetSuite", logo: "/tech/netsuite.png" },
  { name: "SuiteScript 2.1", logo: "/tech/suitescript.png" },
  { name: "JavaScript (ES6+)", logo: "/tech/javascript.png" },
  { name: "TypeScript", logo: "/tech/typescript.png" },
  { name: "React", logo: "/tech/react.png" },
  { name: "Tailwind CSS", logo: "/tech/tailwind.png" },
  { name: "n8n", logo: "/tech/n8n.png" },
  { name: "REST API", logo: "/tech/restapi.png" },
  { name: "OAuth 2.0" },
  { name: "HTML/CSS", logo: "/tech/html5.png" },
  { name: "Google Apps Script" },
  { name: "Supabase", logo: "/tech/supabase.png" },
  { name: "Vercel", logo: "/tech/vercel.png" },
  { name: "Claude API", logo: "/tech/claude.png" },
  { name: "GPT-4o", logo: "/tech/openai.png" },
  { name: "Gemini API", logo: "/tech/gemini.png" },
  { name: "PandaDoc" },
  { name: "Asana" },
  { name: "Google Sheets", logo: "/tech/googlesheets.png" },
  { name: "Meta Business Suite" },
];

const CERTS = [
  { name: "NetSuite ERP Consultant", badge: "/badges/netsuite-certified.png" },
  { name: "NetSuite SuiteFoundation", badge: "/badges/netsuite-impl.png" },
  { name: "NetSuite AI Foundation", badge: "/badges/ai-automation.png" },
];

export default function TechSkills() {
  return (
    <section id="certifications" className="max-w-7xl mx-auto px-6 lg:px-10 py-24 grid lg:grid-cols-2 gap-10">
      <div>
        <span className="font-mono text-[11px] tracking-[0.2em] uppercase text-cyan">Technical Skills</span>
        <h2 className="font-display font-bold text-2xl sm:text-3xl mt-3 mb-7">
          Technologies <span className="text-cyan">I Work With</span>
        </h2>
        <div className="flex flex-wrap gap-2.5">
          {SKILLS.map((s, i) => (
            <motion.span
              key={s.name}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ delay: i * 0.02, duration: 0.3 }}
              whileHover={{ scale: 1.07, y: -2, borderColor: "rgba(61,169,252,0.5)", transition: { type: "spring", stiffness: 400, damping: 14 } }}
              className="inline-flex items-center gap-1.5 font-mono text-xs text-mist bg-panel border border-line rounded-lg px-3 py-2 cursor-default"
            >
              {s.logo && <img src={s.logo} alt="" className="w-4 h-4 object-contain shrink-0" />}
              {s.name}
            </motion.span>
          ))}
        </div>
      </div>

      <div>
        <span className="font-mono text-[11px] tracking-[0.2em] uppercase text-amber">Certifications</span>
        <h2 className="font-display font-bold text-2xl sm:text-3xl mt-3 mb-7">
          Professional <span className="text-amber">Certifications</span>
        </h2>
        <div className="grid grid-cols-3 gap-4">
          {CERTS.map((c, i) => (
            <motion.div
              key={c.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ delay: i * 0.1, duration: 0.4 }}
              whileHover={cardHover}
              className="bg-ink/50 border border-amber/30 rounded-xl p-4 text-center transition-colors hover:border-amber/70"
            >
              <img src={c.badge} alt={c.name} className="w-full aspect-square object-contain mb-2" />
              <p className="font-display text-xs font-semibold leading-tight">{c.name}</p>
              <p className="text-[10px] font-mono text-amber mt-1">Certified</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
