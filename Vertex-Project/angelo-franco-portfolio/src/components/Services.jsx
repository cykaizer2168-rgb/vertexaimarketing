import { useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ArrowLeft, ArrowRight } from "lucide-react";

// Areas of Expertise — a horizontal carousel (embla) adapted to the site theme.
// Each card uses an on-brand gradient + a badge icon. `image` is optional: if set,
// it renders as a photo background instead of the gradient.
const EXPERTISE = [
  {
    id: "netsuite-implementation",
    title: "NetSuite Implementation",
    description:
      "End-to-end NetSuite implementations — from discovery and solution design to configuration, training, and a smooth go-live with hypercare.",
    badge: "/badges/netsuite-impl.png",
  },
  {
    id: "managed-services",
    title: "NetSuite Managed Services",
    description:
      "Ongoing NetSuite support and optimization: enhancements, health checks, and continuous improvements that keep the system running at its best.",
    badge: "/badges/managed-services.png",
  },
  {
    id: "ai-automation",
    title: "AI Automation & Agent Design",
    description:
      "AI agents, chatbots, and internal assistants — plus process and document automation powered by LLMs to eliminate repetitive work.",
    badge: "/badges/ai-automation.png",
  },
  {
    id: "ecommerce",
    title: "eCommerce Integration",
    description:
      "Bi-directional Shopify and WooCommerce integrations with NetSuite: real-time inventory, order, and fulfillment sync via REST APIs.",
    badge: "/badges/ecommerce.png",
  },
  {
    id: "custom-development",
    title: "Custom Development",
    description:
      "Custom SuiteScript 2.1, React/TypeScript, and Google Apps Script solutions built to fit exactly how your systems need to work.",
    badge: "/badges/rest-api.png",
  },
  {
    id: "consulting",
    title: "Consulting & Advisory",
    description:
      "Business discovery, fit/gap analysis, solution architecture, and process optimization to guide confident digital transformation.",
    badge: "/badges/industry-expert.png",
  },
];

export default function Services() {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    dragFree: true,
    containScroll: "trimSnaps",
  });
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
    <section id="expertise" className="py-24">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div className="flex items-end justify-between mb-10 lg:mb-12">
          <div>
            <span className="font-mono text-[11px] tracking-[0.2em] uppercase text-cyan">What I Do</span>
            <h2 className="font-display font-bold text-3xl sm:text-4xl mt-3">
              Areas of <span className="text-cyan">Expertise</span>
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
        <div className="flex gap-5 max-w-7xl mx-auto px-6 lg:px-10">
          {EXPERTISE.map((item) => (
            <div
              key={item.id}
              className="min-w-0 shrink-0 grow-0 basis-[82%] sm:basis-[46%] lg:basis-[31.5%]"
            >
              <article className="group relative h-full min-h-[23rem] rounded-2xl overflow-hidden border border-line bg-gradient-to-br from-panel2 to-ink transition-colors hover:border-cyan/45">
                {item.image ? (
                  <img src={item.image} alt={item.title} className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                ) : (
                  <span aria-hidden className="absolute -top-16 -right-14 w-52 h-52 rounded-full bg-cyan/10 blur-3xl" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-transparent" />

                <img src={item.badge} alt="" className="absolute top-6 left-6 w-16 h-16 object-contain drop-shadow-lg" />

                <div className="absolute inset-x-0 bottom-0 p-6">
                  <h3 className="font-display font-semibold text-xl mb-2 leading-snug">{item.title}</h3>
                  <p className="text-sm text-mist leading-relaxed line-clamp-3">{item.description}</p>
                </div>
              </article>
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
