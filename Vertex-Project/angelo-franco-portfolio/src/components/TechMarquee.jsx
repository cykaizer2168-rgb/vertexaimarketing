import { motion } from "framer-motion";

const TECH = [
  { name: "Oracle", logo: "/tech/oracle.png" },
  { name: "NetSuite", logo: "/tech/netsuite.png" },
  { name: "Shopify", logo: "/tech/shopify.png" },
  { name: "WooCommerce", logo: "/tech/woocommerce.png" },
  { name: "Supabase", logo: "/tech/supabase.png" },
  { name: "React", logo: "/tech/react.png" },
  { name: "OpenAI", logo: "/tech/openai.png" },
  { name: "Claude", logo: "/tech/claude.png" },
  { name: "Gemini", logo: "/tech/gemini.png" },
  { name: "n8n", logo: "/tech/n8n.png" },
];

export default function TechMarquee() {
  return (
    <section className="border-y border-line bg-panel/40 py-8 overflow-hidden">
      <p className="text-center font-mono text-[11px] tracking-[0.25em] uppercase text-mist mb-6">
        Trusted Technologies &amp; Platforms
      </p>
      <div className="relative max-w-7xl mx-auto overflow-hidden">
        <motion.div
          className="flex items-center gap-16 whitespace-nowrap"
          animate={{ x: ["0%", "-50%"] }}
          transition={{ duration: 24, repeat: Infinity, ease: "linear" }}
        >
          {[...TECH, ...TECH].map((t, i) => (
            <img
              key={i}
              src={t.logo}
              alt={t.name}
              title={t.name}
              className="h-11 w-auto shrink-0 object-contain opacity-90 hover:opacity-100 transition-opacity"
            />
          ))}
        </motion.div>
      </div>
    </section>
  );
}
