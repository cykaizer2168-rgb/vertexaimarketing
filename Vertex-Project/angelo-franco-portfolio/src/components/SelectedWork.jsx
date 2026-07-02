import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ImagePlaceholder } from "./Placeholder";
import { cardHover } from "../lib/cardHover";

// Case studies come from the CRM (Supabase) via the Home route loader. Each published
// case study renders a card that links to its page.
export default function SelectedWork({ caseStudies = [] }) {
  return (
    <section id="projects" className="max-w-7xl mx-auto px-6 lg:px-10 py-24">
      <div className="text-center mb-14">
        <span className="font-mono text-[11px] tracking-[0.2em] uppercase text-cyan">Featured Projects</span>
        <h2 className="font-display font-bold text-3xl sm:text-4xl mt-3">
          Selected <span className="text-cyan">Work</span>
        </h2>
      </div>

      {caseStudies.length === 0 ? (
        <p className="text-center text-mist text-sm">Case studies coming soon.</p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {caseStudies.map((cs, i) => (
            <motion.article
              key={cs.slug}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ delay: i * 0.08, duration: 0.5 }}
              whileHover={cardHover}
              className="bg-panel border border-line rounded-2xl overflow-hidden group transition-colors hover:border-cyan/45"
            >
              {cs.hero && !cs.hero.placeholder && cs.hero.type === "image" && cs.hero.src ? (
                <img
                  src={cs.hero.src}
                  alt={cs.hero.alt || cs.title}
                  className="w-full aspect-[16/10] object-cover"
                />
              ) : (
                <ImagePlaceholder
                  label={`Project — ${cs.title}`}
                  ratio="aspect-[16/10]"
                  className="rounded-none rounded-t-2xl border-x-0 border-t-0"
                />
              )}
              <div className="p-5">
                {cs.category && (
                  <span className="font-mono text-[10px] tracking-[0.15em] uppercase text-cyan">{cs.category}</span>
                )}
                <h3 className="font-display font-semibold text-base mb-2 mt-1 leading-snug">{cs.title}</h3>
                <p className="text-sm text-mist leading-relaxed mb-4 line-clamp-3">{cs.summary}</p>
                <Link
                  to={`/case-studies/${cs.slug}`}
                  className="inline-flex items-center gap-1.5 text-cyan text-sm font-medium group-hover:gap-2.5 transition-all"
                >
                  View Case Study <span aria-hidden>→</span>
                </Link>
              </div>
            </motion.article>
          ))}
        </div>
      )}
    </section>
  );
}
