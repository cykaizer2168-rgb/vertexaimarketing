import { Head } from "vite-react-ssg";
import { useLoaderData, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Linkedin, Calendar, Image as ImageIcon } from "lucide-react";

const SITE = "https://buildwithfranco.com";

export default function CaseStudy() {
  const { caseStudy: cs } = useLoaderData();

  if (!cs) {
    return (
      <section className="max-w-3xl mx-auto px-6 pt-40 pb-32 text-center">
        <h1 className="font-display font-bold text-3xl">Case study not found</h1>
        <Link to="/#projects" className="inline-block mt-6 text-cyan hover:underline">
          ← Back to Projects
        </Link>
      </section>
    );
  }

  const pageUrl = `${SITE}/case-studies/${cs.slug}`;
  const shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(pageUrl)}`;
  const title = `${cs.title} — Case Study | Angelo B. Franco`;

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={cs.summary} />
        <link rel="canonical" href={pageUrl} />
        <meta property="og:type" content="article" />
        <meta property="og:site_name" content="Angelo B. Franco" />
        <meta property="og:title" content={`${cs.title} — Case Study`} />
        <meta property="og:description" content={cs.summary} />
        <meta property="og:url" content={pageUrl} />
        <meta property="og:image" content={cs.ogImage} />
        <meta property="og:image:secure_url" content={cs.ogImage} />
        <meta property="og:image:type" content="image/png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content={`${cs.title} — Case Study`} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${cs.title} — Case Study`} />
        <meta name="twitter:description" content={cs.summary} />
        <meta name="twitter:image" content={cs.ogImage} />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            headline: `${cs.title} — Case Study`,
            description: cs.summary,
            image: cs.ogImage,
            author: { "@type": "Person", name: "Angelo B. Franco", url: SITE },
            publisher: { "@type": "Person", name: "Angelo B. Franco", url: SITE },
            mainEntityOfPage: { "@type": "WebPage", "@id": pageUrl },
            about: cs.category,
            keywords: (cs.techStack || []).join(", "),
          })}
        </script>
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: `${SITE}/` },
              { "@type": "ListItem", position: 2, name: "Projects", item: `${SITE}/#projects` },
              { "@type": "ListItem", position: 3, name: cs.title, item: pageUrl },
            ],
          })}
        </script>
      </Head>

      <article className="max-w-3xl mx-auto px-6 lg:px-8 pt-32 pb-24">
        <Link
          to="/#projects"
          className="inline-flex items-center gap-2 text-sm text-mist hover:text-cyan transition-colors"
        >
          <ArrowLeft size={15} /> Back to Projects
        </Link>

        <header className="mt-8">
          <span className="font-mono text-[11px] tracking-[0.2em] uppercase text-cyan">
            {cs.category}
          </span>
          <h1 className="font-display font-bold text-3xl sm:text-4xl leading-[1.15] mt-3">
            {cs.title}
          </h1>
          <p className="text-mist mt-4 leading-relaxed">{cs.summary}</p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-5 text-xs text-mist">
            <span>{cs.role}</span>
            <span className="text-line">•</span>
            <span>{cs.date}</span>
            <a
              href={shareUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 ml-auto text-cyan hover:text-white transition-colors"
            >
              <Linkedin size={14} /> Share on LinkedIn
            </a>
          </div>
        </header>

        {/* Hero media — image or video, with a clean placeholder until real media is added */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mt-8 rounded-2xl overflow-hidden border border-line bg-panel"
        >
          {cs.hero.placeholder ? (
            <div className="w-full aspect-video flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-panel2 to-panel text-mist">
              <ImageIcon size={30} className="opacity-60" />
              <span className="text-sm font-medium">Demo {cs.hero.type === "video" ? "video" : "screenshot"} coming soon</span>
            </div>
          ) : cs.hero.type === "video" ? (
            <video controls poster={cs.hero.poster} className="w-full aspect-video object-cover bg-panel2">
              <source src={cs.hero.src} type="video/mp4" />
            </video>
          ) : (
            <img src={cs.hero.src} alt={cs.hero.alt} className="w-full aspect-video object-cover bg-panel2" />
          )}
        </motion.div>

        {/* Structured sections */}
        <div className="mt-12 space-y-10">
          {cs.sections.map((s) => (
            <section key={s.heading}>
              <h2 className="font-display font-semibold text-xl text-white mb-3">{s.heading}</h2>
              <p className="text-mist leading-relaxed">{s.body}</p>
            </section>
          ))}
        </div>

        {/* Results */}
        {cs.results?.length > 0 && (
          <div className="mt-12">
            <h2 className="font-display font-semibold text-xl text-white mb-5">Results</h2>
            <div className="grid grid-cols-3 gap-4">
              {cs.results.map((r) => (
                <div
                  key={r.label}
                  className="bg-panel border border-line rounded-xl p-5 text-center"
                >
                  <div className="font-display font-bold text-2xl sm:text-3xl text-cyan">{r.value}</div>
                  <div className="text-xs text-mist mt-1.5 leading-snug">{r.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tech stack */}
        {cs.techStack?.length > 0 && (
          <div className="mt-12">
            <h2 className="font-display font-semibold text-xl text-white mb-5">Tech Stack</h2>
            <div className="flex flex-wrap gap-2.5">
              {cs.techStack.map((t) => (
                <span
                  key={t}
                  className="font-mono text-[12px] text-mist bg-panel border border-line rounded-full px-3.5 py-1.5"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="mt-16 bg-gradient-to-br from-panel to-panel2 border border-line rounded-2xl p-8 text-center">
          <h2 className="font-display font-bold text-2xl">
            Interested in this kind of <span className="text-cyan">work?</span>
          </h2>
          <p className="text-mist mt-3 max-w-md mx-auto">
            Happy to connect, answer questions, or talk shop about NetSuite and AI automation.
          </p>
          <div className="flex flex-wrap justify-center gap-3 mt-6">
            <a
              href="mailto:angelo.franco@buildwithfranco.com?subject=Hello%20from%20your%20site"
              className="inline-flex items-center gap-2 bg-cyan text-ink font-semibold text-sm px-5 py-3 rounded-lg hover:bg-cyan/90 transition-colors"
            >
              <Calendar size={16} /> Get in Touch
            </a>
            <a
              href={shareUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 border border-line text-white font-medium text-sm px-5 py-3 rounded-lg hover:bg-panel transition-colors"
            >
              <Linkedin size={16} /> Share on LinkedIn
            </a>
          </div>
        </div>
      </article>
    </>
  );
}
