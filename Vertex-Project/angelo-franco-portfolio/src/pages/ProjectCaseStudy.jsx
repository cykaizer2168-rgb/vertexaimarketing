import { useState } from "react";
import { Head } from "vite-react-ssg";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, ExternalLink, Play, Check, Calendar } from "lucide-react";
import { getProject } from "../data/projects";
import VideoModal from "../components/VideoModal";

const SITE = "https://buildwithfranco.com";

export default function ProjectCaseStudy() {
  const { slug } = useParams();
  const p = getProject(slug);
  const [showVideo, setShowVideo] = useState(false);

  if (!p) {
    return (
      <section className="max-w-3xl mx-auto px-6 pt-40 pb-32 text-center">
        <h1 className="font-display font-bold text-3xl">Project not found</h1>
        <Link to="/#projects" className="inline-block mt-6 text-cyan hover:underline">← Back to Projects</Link>
      </section>
    );
  }

  const pageUrl = `${SITE}/projects/${p.slug}`;
  const ogImage = `${SITE}${p.image}`;

  return (
    <>
      <Head>
        <title>{`${p.title} — Case Study | Angelo B. Franco`}</title>
        <meta name="description" content={p.summary} />
        <link rel="canonical" href={pageUrl} />
        <meta property="og:type" content="article" />
        <meta property="og:site_name" content="Angelo B. Franco" />
        <meta property="og:title" content={`${p.title} — Case Study`} />
        <meta property="og:description" content={p.summary} />
        <meta property="og:url" content={pageUrl} />
        <meta property="og:image" content={ogImage} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${p.title} — Case Study`} />
        <meta name="twitter:description" content={p.summary} />
        <meta name="twitter:image" content={ogImage} />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            headline: `${p.title} — Case Study`,
            description: p.summary,
            image: ogImage,
            author: { "@type": "Person", name: "Angelo B. Franco", url: SITE },
            mainEntityOfPage: { "@type": "WebPage", "@id": pageUrl },
            about: p.category,
            keywords: (p.techStack || []).join(", "),
          })}
        </script>
      </Head>

      <article className="max-w-4xl mx-auto px-6 lg:px-8 pt-32 pb-24">
        <Link to="/#projects" className="inline-flex items-center gap-2 text-sm text-mist hover:text-cyan transition-colors">
          <ArrowLeft size={15} /> Back to Projects
        </Link>

        <header className="mt-8">
          <span className="font-mono text-[11px] tracking-[0.2em] uppercase text-cyan">{p.category}</span>
          <h1 className="font-display font-bold text-3xl sm:text-4xl leading-[1.15] mt-3">{p.title}</h1>
          <p className="text-mist mt-4 leading-relaxed max-w-2xl">{p.summary}</p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-5 text-xs text-mist">
            <span>{p.role}</span>
            <span className="text-line">•</span>
            <span>{p.year}</span>
            <a href={p.liveUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 ml-auto text-cyan hover:text-white transition-colors">
              Visit live site <ExternalLink size={14} />
            </a>
          </div>
        </header>

        {/* Hero: screenshot (+ play overlay if a demo video is set) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative mt-8 rounded-2xl overflow-hidden border border-line group"
        >
          <img src={p.image} alt={p.title} className="w-full aspect-video object-cover object-top" />
          {p.video && (
            <button
              onClick={() => setShowVideo(true)}
              aria-label="Play demo"
              className="absolute inset-0 flex items-center justify-center bg-ink/30 hover:bg-ink/45 transition-colors"
            >
              <span className="w-16 h-16 rounded-full bg-cyan/90 text-ink flex items-center justify-center shadow-lg transition-transform group-hover:scale-110">
                <Play size={26} className="ml-1" fill="currentColor" />
              </span>
            </button>
          )}
        </motion.div>

        {/* Overview */}
        <section className="mt-12">
          <h2 className="font-display font-semibold text-xl text-white mb-3">Overview</h2>
          <p className="text-mist leading-relaxed max-w-2xl">{p.overview}</p>
        </section>

        {/* Features */}
        {p.features?.length > 0 && (
          <section className="mt-12">
            <h2 className="font-display font-semibold text-xl text-white mb-6">Key Features</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {p.features.map((f) => (
                <div key={f.title} className="bg-panel border border-line rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-5 h-5 rounded-full bg-cyan/15 text-cyan flex items-center justify-center shrink-0">
                      <Check size={13} />
                    </span>
                    <h3 className="font-display font-semibold text-[15px] text-white">{f.title}</h3>
                  </div>
                  <p className="text-sm text-mist leading-relaxed">{f.description}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Tech stack */}
        {p.techStack?.length > 0 && (
          <section className="mt-12">
            <h2 className="font-display font-semibold text-xl text-white mb-5">Tech Stack</h2>
            <div className="flex flex-wrap gap-2.5">
              {p.techStack.map((t) => (
                <span key={t} className="font-mono text-[12px] text-mist bg-panel border border-line rounded-full px-3.5 py-1.5">{t}</span>
              ))}
            </div>
          </section>
        )}

        {/* CTA */}
        <div className="mt-14 bg-gradient-to-br from-panel to-panel2 border border-line rounded-2xl p-8 text-center">
          <h2 className="font-display font-bold text-2xl">See it in action</h2>
          <p className="text-mist mt-3 max-w-md mx-auto">Explore the live project, or reach out if you'd like to talk about the work.</p>
          <div className="flex flex-wrap justify-center gap-3 mt-6">
            <a href={p.liveUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-cyan text-ink font-semibold text-sm px-5 py-3 rounded-lg hover:bg-cyan/90 transition-colors">
              <ExternalLink size={16} /> Visit live site
            </a>
            <a href="mailto:angelo.franco@buildwithfranco.com?subject=Hello%20from%20your%20site" className="inline-flex items-center gap-2 border border-line text-white font-medium text-sm px-5 py-3 rounded-lg hover:bg-panel transition-colors">
              <Calendar size={16} /> Get in Touch
            </a>
          </div>
        </div>
      </article>

      {showVideo && p.video && (
        <VideoModal video={p.video} title={`${p.title} — Demo`} onClose={() => setShowVideo(false)} />
      )}
    </>
  );
}
