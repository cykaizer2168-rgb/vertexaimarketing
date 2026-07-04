import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import useEmblaCarousel from "embla-carousel-react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { ImagePlaceholder } from "./Placeholder";
import { cardHover } from "../lib/cardHover";
import { projects } from "../data/projects";

export default function SelectedWork({ caseStudies = [] }) {
  const items = [
    ...projects.map((p) => ({
      key: p.slug,
      image: p.image,
      category: p.category,
      title: p.title,
      summary: p.summary,
      to: `/projects/${p.slug}`,
      cta: "Learn More",
    })),
    ...caseStudies.map((cs) => ({
      key: cs.slug,
      image: cs.hero && !cs.hero.placeholder && cs.hero.type === "image" && cs.hero.src ? cs.hero.src : null,
      category: cs.category,
      title: cs.title,
      summary: cs.summary,
      to: `/case-studies/${cs.slug}`,
      cta: "View Case Study",
    })),
  ];

  const [emblaRef, emblaApi] = useEmblaCarousel({ align: "start", dragFree: true, containScroll: "trimSnaps" });
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);
  const [snaps, setSnaps] = useState([]);
  const [selected, setSelected] = useState(0);

  useEffect(() => {
    if (!emblaApi) return;
    const update = () => {
      setCanPrev(emblaApi.canScrollPrev());
      setCanNext(emblaApi.canScrollNext());
      setSelected(emblaApi.selectedScrollSnap());
    };
    setSnaps(emblaApi.scrollSnapList());
    update();
    emblaApi.on("select", update);
    emblaApi.on("reInit", update);
    return () => emblaApi.off("select", update);
  }, [emblaApi]);

  const navBtn =
    "inline-flex items-center justify-center w-10 h-10 rounded-full border border-line text-white transition-colors hover:bg-panel disabled:opacity-30 disabled:pointer-events-none";

  return (
    <section id="projects" className="py-24">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div className="flex items-end justify-between mb-10 lg:mb-12">
          <div>
            <span className="font-mono text-[11px] tracking-[0.2em] uppercase text-cyan">Featured Projects</span>
            <h2 className="font-display font-bold text-3xl sm:text-4xl mt-3">
              Selected <span className="text-cyan">Work</span>
            </h2>
          </div>
          <div className="hidden md:flex shrink-0 gap-2">
            <button aria-label="Previous" className={navBtn} onClick={() => emblaApi?.scrollPrev()} disabled={!canPrev}>
              <ArrowLeft size={18} />
            </button>
            <button aria-label="Next" className={navBtn} onClick={() => emblaApi?.scrollNext()} disabled={!canNext}>
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Carousel */}
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex gap-6 max-w-7xl mx-auto px-6 lg:px-10">
          {items.map((it, i) => (
            <div key={it.key} className="min-w-0 shrink-0 grow-0 basis-[85%] sm:basis-[47%] lg:basis-[32%]">
              <motion.article
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ delay: (i % 3) * 0.08, duration: 0.5 }}
                whileHover={cardHover}
                className="bg-panel border border-line rounded-2xl overflow-hidden group h-full flex flex-col transition-colors hover:border-cyan/45"
              >
                <Link to={it.to} className="block overflow-hidden">
                  {it.image ? (
                    <img
                      src={it.image}
                      alt={it.title}
                      className="w-full aspect-[16/10] object-cover object-top transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <ImagePlaceholder label={`Project — ${it.title}`} ratio="aspect-[16/10]" className="rounded-none rounded-t-2xl border-x-0 border-t-0" />
                  )}
                </Link>
                <div className="p-5 flex flex-col flex-1">
                  {it.category && <span className="font-mono text-[10px] tracking-[0.15em] uppercase text-cyan">{it.category}</span>}
                  <h3 className="font-display font-semibold text-base mb-2 mt-1 leading-snug">{it.title}</h3>
                  <p className="text-sm text-mist leading-relaxed mb-4 line-clamp-3 flex-1">{it.summary}</p>
                  <Link to={it.to} className="inline-flex items-center gap-1.5 text-cyan text-sm font-medium group-hover:gap-2.5 transition-all">
                    {it.cta} <ArrowRight size={14} />
                  </Link>
                </div>
              </motion.article>
            </div>
          ))}
        </div>
      </div>

      {/* Dots */}
      <div className="mt-8 flex justify-center gap-2">
        {snaps.map((_, i) => (
          <button
            key={i}
            aria-label={`Go to slide ${i + 1}`}
            onClick={() => emblaApi?.scrollTo(i)}
            className={`h-2 rounded-full transition-all ${selected === i ? "w-6 bg-cyan" : "w-2 bg-cyan/25 hover:bg-cyan/50"}`}
          />
        ))}
      </div>
    </section>
  );
}
