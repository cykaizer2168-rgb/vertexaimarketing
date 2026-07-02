import { supabase } from "../lib/supabase";

// Case studies are authored in the Vertex AI Marketing CRM (vertexai-crm) and stored
// in Supabase (table: case_studies). This module reads PUBLISHED rows at build time
// (SSG loaders / getStaticPaths) and on the client for navigation.
//
// If Supabase is unreachable or not configured, we fall back to LOCAL_FALLBACK so the
// build never breaks and the site always renders something sensible.

const LOCAL_FALLBACK = [
  {
    slug: "ai-automation",
    title: "AI Automation & Workflow Orchestration",
    category: "AI Automation",
    role: "AI Automation Architect",
    date: "2026",
    summary:
      "Designed and deployed AI agents and end-to-end automation workflows with n8n and LLMs to eliminate manual, repetitive business processes — cutting turnaround time and freeing the team to focus on higher-value work.",
    hero: {
      type: "image",
      placeholder: true,
      src: "/case-studies/ai-automation-hero.jpg",
      poster: "/case-studies/ai-automation-hero.jpg",
      alt: "AI automation workflow built with n8n and LLMs",
    },
    ogImage: "https://buildwithfranco.com/case-studies/ai-automation-og.png",
    sections: [
      { heading: "Overview", body: "A growing operations team was drowning in repetitive, manual tasks — copying data between systems, triaging inbound messages, and chasing follow-ups by hand. The goal was to design an AI-powered automation layer that could handle these workflows reliably, 24/7, without adding headcount. [Replace with your own overview.]" },
      { heading: "The Challenge", body: "Data lived in disconnected tools, and every process depended on someone manually moving information from A to B. This created bottlenecks, delayed responses, and a high risk of human error. [Replace with the real problem you solved.]" },
      { heading: "The Solution", body: "I built a suite of automation workflows in n8n, orchestrating triggers, data transformations, and integrations across the client's stack, with LLM-powered steps for classification, summarization, and drafting replies. [Replace with your implementation details.]" },
      { heading: "Architecture", body: "Event-driven workflows in n8n handle orchestration and integration; LLM nodes handle language tasks; and REST/webhook connections tie everything to the source systems. [Describe your architecture.]" },
    ],
    results: [
      { value: "80%", label: "Manual work eliminated" },
      { value: "24/7", label: "Always-on processing" },
      { value: "10x", label: "Faster turnaround" },
    ],
    techStack: ["n8n", "LLMs / GPT", "REST APIs", "Webhooks", "JavaScript", "NetSuite"],
  },
];

// Map a Supabase row (snake_case) → the shape the components expect.
function mapRow(row) {
  return {
    slug: row.slug,
    title: row.title,
    category: row.category,
    role: row.role,
    date: row.date,
    summary: row.summary,
    hero: {
      type: row.hero_type || "image",
      placeholder: row.hero_placeholder !== false,
      src: row.hero_src,
      poster: row.hero_poster,
      alt: row.hero_alt,
    },
    ogImage: row.og_image,
    sections: Array.isArray(row.sections) ? row.sections : [],
    results: Array.isArray(row.results) ? row.results : [],
    techStack: Array.isArray(row.tech_stack) ? row.tech_stack : [],
  };
}

export async function fetchPublishedCaseStudies() {
  if (!supabase) return LOCAL_FALLBACK;
  try {
    const { data, error } = await supabase
      .from("case_studies")
      .select("*")
      .eq("published", true)
      .order("sort_order", { ascending: true })
      .order("updated_at", { ascending: false });
    if (error) {
      console.warn("[caseStudies] Supabase read failed, using fallback:", error.message);
      return LOCAL_FALLBACK;
    }
    return (data ?? []).map(mapRow);
  } catch (err) {
    console.warn("[caseStudies] Supabase unreachable, using fallback:", err?.message);
    return LOCAL_FALLBACK;
  }
}

export async function fetchCaseStudy(slug) {
  const all = await fetchPublishedCaseStudies();
  return all.find((c) => c.slug === slug) ?? null;
}
