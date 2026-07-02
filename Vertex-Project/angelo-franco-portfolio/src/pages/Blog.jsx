import { Head } from "vite-react-ssg";
import { useLoaderData, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { readingMinutes } from "../data/posts";
import { cardHover } from "../lib/cardHover";
import { ImagePlaceholder } from "../components/Placeholder";

const SITE = "https://angelo-franco-portfolio.vercel.app";

function formatDate(iso) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

export default function Blog() {
  const { posts } = useLoaderData();

  return (
    <>
      <Head>
        <title>Blog — Angelo B. Franco | NetSuite & AI Automation Insights</title>
        <meta name="description" content="Articles and insights on NetSuite ERP, AI automation, and building systems that run your business — by Angelo B. Franco." />
        <link rel="canonical" href={`${SITE}/blog`} />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Blog — Angelo B. Franco" />
        <meta property="og:description" content="Insights on NetSuite ERP, AI automation, and smarter business systems." />
        <meta property="og:url" content={`${SITE}/blog`} />
        <meta property="og:image" content={`${SITE}/og-image.png`} />
      </Head>

      <section className="max-w-6xl mx-auto px-6 lg:px-10 pt-32 pb-24">
        <div className="text-center mb-14">
          <span className="font-mono text-[11px] tracking-[0.2em] uppercase text-cyan">Insights</span>
          <h1 className="font-display font-bold text-4xl sm:text-5xl mt-3">The <span className="text-cyan">Blog</span></h1>
          <p className="text-mist mt-4 max-w-xl mx-auto">Practical notes on NetSuite ERP, AI automation, and building systems that run your business 24/7.</p>
        </div>

        {posts.length === 0 ? (
          <p className="text-center text-mist text-sm">No articles yet — check back soon.</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((p, i) => (
              <motion.article
                key={p.slug}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ delay: i * 0.06, duration: 0.5 }}
                whileHover={cardHover}
                className="bg-panel border border-line rounded-2xl overflow-hidden group transition-colors hover:border-cyan/45 flex flex-col"
              >
                <Link to={`/blog/${p.slug}`} className="block">
                  {p.coverImage ? (
                    <img src={p.coverImage} alt={p.title} className="w-full aspect-[16/9] object-cover" />
                  ) : (
                    <ImagePlaceholder label={p.title} ratio="aspect-[16/9]" className="rounded-none rounded-t-2xl border-x-0 border-t-0" />
                  )}
                </Link>
                <div className="p-5 flex flex-col flex-1">
                  <div className="flex items-center gap-2 text-[11px] text-mist mb-2">
                    {p.tags?.[0] && <span className="font-mono uppercase tracking-wide text-cyan">{p.tags[0]}</span>}
                    <span>{formatDate(p.publishedAt)}</span>
                    <span>· {readingMinutes(p.body)} min read</span>
                  </div>
                  <h2 className="font-display font-semibold text-lg leading-snug mb-2">
                    <Link to={`/blog/${p.slug}`} className="hover:text-cyan transition-colors">{p.title}</Link>
                  </h2>
                  <p className="text-sm text-mist leading-relaxed line-clamp-3 flex-1">{p.excerpt}</p>
                  <Link to={`/blog/${p.slug}`} className="inline-flex items-center gap-1.5 text-cyan text-sm font-medium mt-4 group-hover:gap-2.5 transition-all">
                    Read article <span aria-hidden>→</span>
                  </Link>
                </div>
              </motion.article>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
