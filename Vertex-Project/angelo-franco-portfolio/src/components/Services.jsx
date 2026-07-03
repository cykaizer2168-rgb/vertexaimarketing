import { motion } from "framer-motion";
import { LinkPlaceholder } from "./Placeholder";
import { cardHover } from "../lib/cardHover";

const SERVICES = [
  {
    badge: "/badges/netsuite-impl.png",
    title: "NetSuite Implementation",
    items: ["Discovery & Analysis", "Solution Design", "Configuration", "Training & UAT", "Go-live & Hypercare"],
  },
  {
    badge: "/badges/managed-services.png",
    title: "NetSuite Managed Services",
    items: ["Monthly Support", "Enhancements", "System Optimization", "Bug Fixes", "Health Checks"],
  },
  {
    badge: "/badges/ai-automation.png",
    title: "AI Automation & Agent Design",
    items: ["AI Agents & Chatbots", "Internal AI Assistants", "Process Automation", "Document Processing", "LLM Integration"],
  },
  {
    badge: "/badges/ecommerce.png",
    title: "eCommerce Integration",
    items: ["Shopify Integration", "WooCommerce Integration", "REST API Integration", "Inventory Sync", "Order & Fulfillment Sync"],
  },
  {
    badge: "/badges/rest-api.png",
    title: "Custom Development",
    items: ["SuiteScript 2.1", "React / TypeScript", "Tailwind CSS", "Google Apps Script", "Custom Solutions"],
  },
  {
    badge: "/badges/industry-expert.png",
    title: "Consulting & Advisory",
    items: ["Business Discovery", "Fit/Gap Analysis", "Solution Architecture", "Process Optimization", "Digital Transformation"],
  },
];

export default function Services() {
  return (
    <section id="expertise" className="max-w-7xl mx-auto px-6 lg:px-10 py-24">
      <div className="text-center mb-14">
        <span className="font-mono text-[11px] tracking-[0.2em] uppercase text-cyan">What I Do</span>
        <h2 className="font-display font-bold text-3xl sm:text-4xl mt-3">
          Areas of <span className="text-cyan">Expertise</span>
        </h2>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {SERVICES.map((s, i) => (
          <motion.div
            key={s.title}
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ delay: (i % 3) * 0.08, duration: 0.5 }}
            whileHover={cardHover}
            className="bg-panel border border-line rounded-2xl p-6 hover:border-cyan/45 transition-colors"
          >
            <img src={s.badge} alt="" className="w-16 h-16 object-contain mb-3 -ml-1" />
            <h3 className="font-display font-semibold text-lg mb-3">{s.title}</h3>
            <ul className="space-y-1.5 mb-5">
              {s.items.map((it) => (
                <li key={it} className="text-sm text-mist flex gap-2">
                  <span className="text-cyan mt-1.5 w-1 h-1 rounded-full bg-cyan shrink-0" />
                  {it}
                </li>
              ))}
            </ul>
            <LinkPlaceholder>Learn More</LinkPlaceholder>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
