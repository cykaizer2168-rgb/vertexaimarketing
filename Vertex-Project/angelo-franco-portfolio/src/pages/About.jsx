import { Head } from "vite-react-ssg";
import { Link } from "react-router-dom";

const SITE = "https://buildwithfranco.com";

export default function AboutPage() {
  return (
    <>
      <Head>
        <title>About — Angelo B. Franco | NetSuite ERP & AI Automation</title>
        <meta name="description" content="About Angelo B. Franco — Senior NetSuite ERP consultant and AI automation architect with 7+ years delivering enterprise systems." />
        <link rel="canonical" href={`${SITE}/about`} />
      </Head>

      <article className="article-body max-w-3xl mx-auto px-6 lg:px-8 pt-32 pb-24">
        <span className="font-mono text-[11px] tracking-[0.2em] uppercase text-cyan not-prose">About</span>
        <h1>Angelo B. Franco</h1>
        <p>
          I’m a Senior NetSuite ERP Consultant and AI Automation Architect with 7+ years of
          experience helping companies build smarter systems. My work spans end-to-end NetSuite
          implementations, eCommerce integrations, custom SuiteScript development, and AI-powered
          automation with tools like n8n and LLMs.
        </p>

        <h2>What I do</h2>
        <p>
          My work centers on eliminating manual work — connecting ERP, storefronts, and back-office
          processes into automated, reliable workflows. Across manufacturing, inventory, order
          fulfillment, and compliance, I focus on building systems that run efficiently — and
          increasingly, that run themselves with AI.
        </p>

        <h2>Why this blog</h2>
        <p>
          I write about practical NetSuite tips, AI automation patterns, and real project lessons —
          the kind of hard-won knowledge that’s hard to find in documentation. If you’re building or
          scaling business systems, I hope it’s useful.
        </p>

        <p className="not-prose mt-8 flex flex-wrap gap-3">
          <Link to="/blog" className="inline-flex items-center gap-2 bg-cyan text-ink font-semibold text-sm px-5 py-3 rounded-lg hover:bg-cyan/90 transition-colors">Read the blog</Link>
          <Link to="/contact" className="inline-flex items-center gap-2 border border-line text-white font-medium text-sm px-5 py-3 rounded-lg hover:bg-panel transition-colors">Get in touch</Link>
        </p>
      </article>
    </>
  );
}
