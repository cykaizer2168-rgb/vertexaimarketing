import { supabase } from "../lib/supabase";

// Blog articles authored in the Vertex AI Marketing CRM (table: posts). Read at build
// time (SSG) and on the client for navigation. Falls back to LOCAL_FALLBACK if Supabase
// is unreachable so the build never breaks.

const LOCAL_FALLBACK = [
  {
    slug: "welcome",
    title: "Building Smarter ERP Systems with AI Automation",
    excerpt:
      "Why combining NetSuite ERP expertise with modern AI automation unlocks efficiency most businesses leave on the table.",
    coverImage: null,
    body: "For years, ERP systems like NetSuite have been the backbone of how companies run — orders, inventory, finance, fulfillment. But most teams still bolt manual work on top of them.\n\nThat is exactly where **AI automation** changes the game.\n\n## The opportunity\n\nModern automation platforms like n8n, combined with LLMs, can watch for events, make decisions, and take action across your systems — 24/7.\n\n## What this blog covers\n\n- Practical NetSuite tips\n- AI automation patterns\n- Real case studies\n\nStay tuned — new articles regularly.",
    tags: ["AI Automation", "NetSuite", "ERP"],
    author: "Angelo B. Franco",
    ogImage: null,
    publishedAt: null,
  },
];

function mapRow(row) {
  return {
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    coverImage: row.cover_image,
    body: row.body || "",
    tags: Array.isArray(row.tags) ? row.tags : [],
    author: row.author,
    ogImage: row.og_image,
    publishedAt: row.published_at || row.created_at,
  };
}

export async function fetchPublishedPosts() {
  if (!supabase) return LOCAL_FALLBACK;
  try {
    const { data, error } = await supabase
      .from("posts")
      .select("*")
      .eq("published", true)
      .order("sort_order", { ascending: true })
      .order("published_at", { ascending: false });
    if (error) {
      console.warn("[posts] Supabase read failed, using fallback:", error.message);
      return LOCAL_FALLBACK;
    }
    return (data ?? []).map(mapRow);
  } catch (err) {
    console.warn("[posts] Supabase unreachable, using fallback:", err?.message);
    return LOCAL_FALLBACK;
  }
}

export async function fetchPost(slug) {
  const all = await fetchPublishedPosts();
  return all.find((p) => p.slug === slug) ?? null;
}

// Rough reading time from markdown body (~200 wpm).
export function readingMinutes(body = "") {
  const words = body.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}
