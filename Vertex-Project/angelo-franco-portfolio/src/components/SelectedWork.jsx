import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ExternalLink, Play } from "lucide-react";
import { ImagePlaceholder } from "./Placeholder";
import { cardHover } from "../lib/cardHover";
import VideoModal from "./VideoModal";

// Featured, live projects (proof of work). Each links to the real deployed site.
const FEATURED = [
  {
    id: "balcony-solar-landing",
    category: "Landing Page",
    title: "Balcony Solar PH — Landing Page",
    description:
      "A conversion-focused landing page for a balcony-solar startup — lead capture, a savings calculator, and a clean, mobile-first design for Filipino condo owners.",
    url: "https://balcony-solar-ph.vercel.app",
    image: "/projects/balcony.jpg",
    video: "", // paste a YouTube/Loom/Vimeo link or an .mp4 URL to enable the demo
  },
  {
    id: "balcony-solar-crm",
    category: "CRM · SaaS",
    title: "Balcony Solar PH — CRM",
    description:
      "A custom lead-management CRM: sales pipeline, AI outreach, appointment scheduling, and automated follow-ups — built with Next.js and Supabase.",
    url: "https://vertexai-crm.vercel.app",
    image: "/projects/crm.jpg",
    video: "",
  },
  {
    id: "mayumi-luxe",
    category: "E-Commerce",
    title: "Mayumi Luxe — Landing + Online Store",
    description:
      "A refined silver-jewelry brand site with an integrated online store — product catalog, cart, and an elegant, conversion-driven shopping experience.",
    url: "https://mayumi-luxe.vercel.app",
    image: "/projects/mayumi.jpg",
    video: "",
  },
];

export default function SelectedWork({ caseStudies = [] }) {
  const [activeVideo, setActiveVideo] = useState(null);
  return (
    <section id="projects" className="max-w-7xl mx-auto px-6 lg:px-10 py-24">
      <div className="text-center mb-14">
        <span className="font-mono text-[11px] tracking-[0.2em] uppercase text-cyan">Featured Projects</span>
        <h2 className="font-display font-bold text-3xl sm:text-4xl mt-3">
          Selected <span className="text-cyan">Work</span>
        </h2>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Live projects */}
        {FEATURED.map((p, i) => (
          <motion.article
            key={p.id}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ delay: i * 0.08, duration: 0.5 }}
            whileHover={cardHover}
            className="bg-panel border border-line rounded-2xl overflow-hidden group transition-colors hover:border-cyan/45 flex flex-col"
          >
            <div className="relative overflow-hidden">
              <a href={p.url} target="_blank" rel="noopener noreferrer" className="block">
                <img
                  src={p.image}
                  alt={p.title}
                  className="w-full aspect-[16/10] object-cover object-top transition-transform duration-300 group-hover:scale-105"
                />
              </a>
              {p.video && (
                <button
                  onClick={() => setActiveVideo({ video: p.video, title: `${p.title} — Demo` })}
                  aria-label={`Play ${p.title} demo`}
                  className="absolute inset-0 flex items-center justify-center bg-ink/25 hover:bg-ink/40 transition-colors"
                >
                  <span className="w-14 h-14 rounded-full bg-cyan/90 text-ink flex items-center justify-center shadow-lg transition-transform group-hover:scale-110">
                    <Play size={22} className="ml-0.5" fill="currentColor" />
                  </span>
                </button>
              )}
            </div>
            <div className="p-5 flex flex-col flex-1">
              <span className="font-mono text-[10px] tracking-[0.15em] uppercase text-cyan">{p.category}</span>
              <h3 className="font-display font-semibold text-base mb-2 mt-1 leading-snug">{p.title}</h3>
              <p className="text-sm text-mist leading-relaxed mb-4 flex-1">{p.description}</p>
              <a
                href={p.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-cyan text-sm font-medium group-hover:gap-2.5 transition-all"
              >
                Visit live site <ExternalLink size={14} />
              </a>
            </div>
          </motion.article>
        ))}

        {/* Published case studies from the CMS (if any) */}
        {caseStudies.map((cs, i) => (
          <motion.article
            key={cs.slug}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ delay: (FEATURED.length + i) * 0.08, duration: 0.5 }}
            whileHover={cardHover}
            className="bg-panel border border-line rounded-2xl overflow-hidden group transition-colors hover:border-cyan/45 flex flex-col"
          >
            {cs.hero && !cs.hero.placeholder && cs.hero.type === "image" && cs.hero.src ? (
              <img src={cs.hero.src} alt={cs.hero.alt || cs.title} className="w-full aspect-[16/10] object-cover" />
            ) : (
              <ImagePlaceholder label={`Project — ${cs.title}`} ratio="aspect-[16/10]" className="rounded-none rounded-t-2xl border-x-0 border-t-0" />
            )}
            <div className="p-5 flex flex-col flex-1">
              {cs.category && <span className="font-mono text-[10px] tracking-[0.15em] uppercase text-cyan">{cs.category}</span>}
              <h3 className="font-display font-semibold text-base mb-2 mt-1 leading-snug">{cs.title}</h3>
              <p className="text-sm text-mist leading-relaxed mb-4 line-clamp-3 flex-1">{cs.summary}</p>
              <Link to={`/case-studies/${cs.slug}`} className="inline-flex items-center gap-1.5 text-cyan text-sm font-medium group-hover:gap-2.5 transition-all">
                View Case Study <span aria-hidden>→</span>
              </Link>
            </div>
          </motion.article>
        ))}
      </div>

      {activeVideo && (
        <VideoModal video={activeVideo.video} title={activeVideo.title} onClose={() => setActiveVideo(null)} />
      )}
    </section>
  );
}
