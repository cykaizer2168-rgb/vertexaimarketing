// Featured project case studies (proof of work). Hardcoded rich content — each has
// an overview, key features (with explanations), tech stack, a live link, and an
// optional demo video. Rendered as cards in Selected Work and as pages at
// /projects/:slug.

export const projects = [
  {
    slug: "balcony-solar-landing",
    title: "Balcony Solar PH — Landing Page",
    category: "Landing Page · Marketing",
    role: "Design & Development",
    year: "2026",
    image: "/projects/balcony.jpg",
    liveUrl: "https://balcony-solar-ph.vercel.app",
    video: "",
    summary:
      "A conversion-focused landing page introducing plug-and-play balcony solar to Filipino condo owners — and turning curious visitors into qualified leads.",
    overview:
      "Balcony Solar PH is a new product category in the Philippines, so the landing page had one hard job: explain the idea clearly and convert interest into leads. I designed and built a fast, mobile-first site that educates visitors and captures leads that flow straight into the CRM.",
    features: [
      { title: "Savings calculator", description: "An interactive calculator that estimates monthly electric-bill savings from a visitor's usage — turning an abstract benefit into a concrete peso figure." },
      { title: "Lead capture", description: "Strategically placed forms and CTAs that push new leads directly into the CRM for instant follow-up." },
      { title: "Mobile-first design", description: "Built for a mostly-mobile Filipino audience — fast load times, clean layout, and a trustworthy look." },
      { title: "Education & trust", description: "Clear explanations, FAQs, and social proof to build confidence in an unfamiliar product category." },
    ],
    techStack: ["Next.js", "Tailwind CSS", "TypeScript", "Vercel"],
  },
  {
    slug: "balcony-solar-crm",
    title: "Balcony Solar PH — CRM",
    category: "CRM · SaaS",
    role: "Full-stack Development",
    year: "2026",
    image: "/projects/crm.jpg",
    liveUrl: "https://vertexai-crm.vercel.app",
    video: "",
    summary:
      "A custom lead-management CRM with a visual sales pipeline, AI-assisted outreach, appointment scheduling, and automated follow-ups.",
    overview:
      "Once leads started arriving from the landing page, the team needed a system to work them. Instead of a generic template, I built a full custom CRM tailored to their exact sales process — with automation and AI baked in to move leads faster.",
    features: [
      { title: "Visual sales pipeline", description: "A Kanban board to drag leads through stages from new to closed-won, with instant status at a glance." },
      { title: "AI outreach", description: "AI-assisted message drafting and outreach sequences so leads get engaged quickly and consistently." },
      { title: "Appointment scheduling", description: "Built-in booking with automated email reminders to both the owner and the lead." },
      { title: "Automated follow-ups", description: "n8n-powered workflows fire emails and Telegram alerts as leads progress — nothing falls through the cracks." },
      { title: "Lead-capture integration", description: "Wired directly to the landing page, so new leads appear in the pipeline the moment they submit." },
    ],
    techStack: ["Next.js", "Supabase", "n8n", "OpenAI", "TypeScript", "Tailwind"],
  },
  {
    slug: "mayumi-store",
    title: "Mayumi Luxe — Landing + Online Store",
    category: "E-Commerce",
    role: "Design & Development",
    year: "2026",
    image: "/projects/mayumi.jpg",
    liveUrl: "https://mayumi-luxe.vercel.app",
    video: "",
    summary:
      "An elegant silver-jewelry brand site with an integrated online store — built to match the premium feel of the products.",
    overview:
      "Mayumi Luxe is a fine silver-jewelry brand that needed both an elegant online presence and a real store. I built a conversion-driven storefront with a refined aesthetic that reflects the premium positioning of the brand.",
    features: [
      { title: "Product catalog", description: "A curated catalog with rich product pages, imagery, and details that let the jewelry shine." },
      { title: "Cart & checkout", description: "A smooth cart-to-checkout flow designed to minimize friction and drop-off." },
      { title: "Elegant, on-brand design", description: "A refined, minimal aesthetic that mirrors the premium feel of the products." },
      { title: "Fully responsive", description: "A seamless shopping experience across desktop and mobile." },
    ],
    techStack: ["Next.js", "Tailwind CSS", "TypeScript", "Vercel"],
  },
  {
    slug: "mayumi-erp",
    title: "Mayumi — AI-Powered Mini ERP",
    category: "ERP · AI · Operations",
    role: "Full-stack Development",
    year: "2026",
    image: "/projects/mayumi-erp.jpg",
    liveUrl: "https://mayumi-luxe.vercel.app/admin",
    video: "",
    summary:
      "A lightweight, AI-powered ERP that runs Mayumi's back office — inventory, orders, fulfillment, customers, and profitability — with an AI assistant on top.",
    overview:
      "Behind the storefront, Mayumi needed to actually run the business. I built a lightweight but capable “mini ERP” — the operational backbone that handles everything from inventory to fulfillment, with an AI assistant to surface insights. It brings enterprise-style operations to a small brand, without the enterprise cost or complexity.",
    features: [
      { title: "AI assistant", description: "An in-app assistant that answers questions about the business — sales, inventory, and performance — in plain language, so the owner gets insights without digging through reports." },
      { title: "Dashboard & KPIs", description: "A real-time dashboard with sales charts, key metrics, and a profitability panel so the owner always knows where the business stands." },
      { title: "Inventory & smart reorder", description: "Live stock tracking with reorder logic that flags low inventory before it becomes a lost sale." },
      { title: "Sales orders (Kanban)", description: "A visual order pipeline plus a table view to manage orders from placed to fulfilled." },
      { title: "One-click fulfillment", description: "Fulfill orders and track their status to keep everything moving." },
      { title: "Customer directory", description: "A built-in customer database with history — a CRM living inside the ERP." },
      { title: "Omnichannel", description: "Manage orders and inventory across multiple sales channels from one place." },
      { title: "Profitability analysis", description: "Per-product and overall profitability so pricing and purchasing decisions are data-driven." },
    ],
    techStack: ["Next.js", "Supabase", "OpenAI", "TypeScript", "Tailwind", "Recharts"],
  },
];

export function getProject(slug) {
  return projects.find((p) => p.slug === slug) ?? null;
}
