// Post-build: generate dist/sitemap.xml from static routes + published Supabase
// content (blog posts + case studies), each with a <lastmod>. Runs after
// `vite-react-ssg build`. Safe: if Supabase is unreachable it still writes the
// static routes.
import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";

const SITE = "https://buildwithfranco.com";

function env(key) {
  if (process.env[key]) return process.env[key];
  try {
    const txt = fs.readFileSync(new URL("../.env.local", import.meta.url), "utf8");
    const m = txt.match(new RegExp("^" + key + "=(.*)$", "m"));
    return m ? m[1].trim().replace(/^"|"$/g, "") : undefined;
  } catch {
    return undefined;
  }
}

const STATIC = [
  { loc: "/", priority: "1.0", changefreq: "monthly" },
  { loc: "/blog", priority: "0.9", changefreq: "weekly" },
  { loc: "/about", priority: "0.6", changefreq: "monthly" },
  { loc: "/contact", priority: "0.5", changefreq: "yearly" },
  { loc: "/privacy", priority: "0.3", changefreq: "yearly" },
];

function urlEntry({ loc, priority, changefreq, lastmod }) {
  return (
    `  <url><loc>${SITE}${loc}</loc>` +
    (lastmod ? `<lastmod>${lastmod.slice(0, 10)}</lastmod>` : "") +
    (changefreq ? `<changefreq>${changefreq}</changefreq>` : "") +
    (priority ? `<priority>${priority}</priority>` : "") +
    `</url>`
  );
}

async function main() {
  const url = env("VITE_SUPABASE_URL");
  const anon = env("VITE_SUPABASE_ANON_KEY");
  const entries = [...STATIC];

  if (url && anon) {
    try {
      const sb = createClient(url, anon, { auth: { persistSession: false } });
      const [{ data: posts }, { data: cases }] = await Promise.all([
        sb.from("posts").select("slug,updated_at").eq("published", true),
        sb.from("case_studies").select("slug,updated_at").eq("published", true),
      ]);
      for (const p of posts ?? [])
        entries.push({ loc: `/blog/${p.slug}`, priority: "0.8", changefreq: "monthly", lastmod: p.updated_at });
      for (const c of cases ?? [])
        entries.push({ loc: `/case-studies/${c.slug}`, priority: "0.8", changefreq: "monthly", lastmod: c.updated_at });
    } catch (e) {
      console.warn("[gen-sitemap] Supabase read failed, static routes only:", e?.message);
    }
  }

  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    entries.map(urlEntry).join("\n") +
    `\n</urlset>\n`;

  fs.writeFileSync(new URL("../dist/sitemap.xml", import.meta.url), xml);
  console.log(`[gen-sitemap] wrote ${entries.length} URLs to dist/sitemap.xml`);
}

main();
