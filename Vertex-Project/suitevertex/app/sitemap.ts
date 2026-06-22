import type { MetadataRoute } from "next";
import { sanityFetch } from "@/sanity/lib/fetch";
import { POST_SLUGS_QUERY, JOB_SLUGS_QUERY, LEGAL_SLUGS_QUERY } from "@/sanity/lib/queries";

const BASE = "https://suitevertex.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [posts, jobs, legal] = await Promise.all([
    sanityFetch<{ slug: string }[]>({ query: POST_SLUGS_QUERY, tags: ["post"] }),
    sanityFetch<{ slug: string }[]>({ query: JOB_SLUGS_QUERY, tags: ["job"] }),
    sanityFetch<{ slug: string }[]>({ query: LEGAL_SLUGS_QUERY, tags: ["legalPage"] }),
  ]);
  const staticPaths = ["", "/pricing", "/how-it-works", "/about", "/contact", "/blog", "/careers"];
  return [
    ...staticPaths.map((p) => ({ url: `${BASE}${p}`, lastModified: new Date() })),
    ...posts.map((p) => ({ url: `${BASE}/blog/${p.slug}` })),
    ...jobs.map((j) => ({ url: `${BASE}/careers/${j.slug}` })),
    ...legal.map((l) => ({ url: `${BASE}/legal/${l.slug}` })),
  ];
}
