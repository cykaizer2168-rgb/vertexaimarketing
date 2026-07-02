import { Head } from "vite-react-ssg";
import { useLoaderData, Link } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ArrowLeft, Linkedin, Calendar } from "lucide-react";
import { readingMinutes } from "../data/posts";
import Ad from "../components/Ad";

const SITE = "https://buildwithfranco.com";
const AD_TOP = import.meta.env.VITE_ADSENSE_SLOT_ARTICLE_TOP;
const AD_BOTTOM = import.meta.env.VITE_ADSENSE_SLOT_ARTICLE_BOTTOM;

function formatDate(iso) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  } catch {
    return "";
  }
}

export default function BlogPost() {
  const { post: p } = useLoaderData();

  if (!p) {
    return (
      <section className="max-w-3xl mx-auto px-6 pt-40 pb-32 text-center">
        <h1 className="font-display font-bold text-3xl">Article not found</h1>
        <Link to="/blog" className="inline-block mt-6 text-cyan hover:underline">← Back to Blog</Link>
      </section>
    );
  }

  const pageUrl = `${SITE}/blog/${p.slug}`;
  const shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(pageUrl)}`;
  const ogImage = p.ogImage || p.coverImage || `${SITE}/og-image.png`;

  return (
    <>
      <Head>
        <title>{`${p.title} | Angelo B. Franco`}</title>
        <meta name="description" content={p.excerpt || p.title} />
        <link rel="canonical" href={pageUrl} />
        <meta property="og:type" content="article" />
        <meta property="og:site_name" content="Angelo B. Franco" />
        <meta property="og:title" content={p.title} />
        <meta property="og:description" content={p.excerpt || p.title} />
        <meta property="og:url" content={pageUrl} />
        <meta property="og:image" content={ogImage} />
        {p.publishedAt && <meta property="article:published_time" content={p.publishedAt} />}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={p.title} />
        <meta name="twitter:description" content={p.excerpt || p.title} />
        <meta name="twitter:image" content={ogImage} />
      </Head>

      <article className="max-w-3xl mx-auto px-6 lg:px-8 pt-32 pb-24">
        <Link to="/blog" className="inline-flex items-center gap-2 text-sm text-mist hover:text-cyan transition-colors">
          <ArrowLeft size={15} /> Back to Blog
        </Link>

        <header className="mt-8">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-mist">
            {p.tags?.map((t) => (
              <span key={t} className="font-mono uppercase tracking-wide text-cyan">{t}</span>
            ))}
          </div>
          <h1 className="font-display font-bold text-3xl sm:text-4xl leading-[1.15] mt-3">{p.title}</h1>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-4 text-xs text-mist">
            <span>{p.author}</span>
            <span className="text-line">•</span>
            <span>{formatDate(p.publishedAt)}</span>
            <span className="text-line">•</span>
            <span>{readingMinutes(p.body)} min read</span>
            <a href={shareUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 ml-auto text-cyan hover:text-white transition-colors">
              <Linkedin size={14} /> Share
            </a>
          </div>
        </header>

        {p.coverImage && (
          <img src={p.coverImage} alt={p.title} className="w-full aspect-video object-cover rounded-2xl border border-line mt-8" />
        )}

        <Ad slot={AD_TOP} className="mt-8" />

        <div className="article-body mt-8">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{p.body}</ReactMarkdown>
        </div>

        <Ad slot={AD_BOTTOM} />

        <div className="mt-14 border-t border-line pt-8 flex flex-wrap items-center gap-3">
          <a href={shareUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 border border-line text-white font-medium text-sm px-5 py-3 rounded-lg hover:bg-panel transition-colors">
            <Linkedin size={16} /> Share on LinkedIn
          </a>
          <a href="mailto:angelo.franco@buildwithfranco.com?subject=Project%20Inquiry" className="inline-flex items-center gap-2 bg-cyan text-ink font-semibold text-sm px-5 py-3 rounded-lg hover:bg-cyan/90 transition-colors">
            <Calendar size={16} /> Work with me
          </a>
          <Link to="/blog" className="text-cyan text-sm font-medium ml-auto hover:underline">← More articles</Link>
        </div>
      </article>
    </>
  );
}
