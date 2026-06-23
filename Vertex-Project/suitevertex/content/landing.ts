// Content for the SuiteVertex landing page (BalconySolar-style template).
// Full reference spec: docs/landing-page-prompt.md

export const BRAND = {
  name: "SuiteVertex",
  tagline: "ERP, AI Automation, and Integration Work — on a Monthly Plan.",
  footerLine: "ERP, AI automation, and integration services for growing businesses.",
} as const;

export const NAV_LINKS = [
  { label: "Services", href: "#services" },
  { label: "How it Works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
] as const;

export const FOOTER_NAV = [
  { label: "How it works", href: "#how-it-works" },
  { label: "About", href: "/about" },
  { label: "Blog", href: "/blog" },
  { label: "Careers", href: "/careers" },
  { label: "Contact", href: "#contact" },
] as const;

export const FOOTER_LEGAL = [
  { label: "Terms", href: "/legal/terms" },
  { label: "SLA", href: "/legal/sla" },
  { label: "Privacy", href: "/legal/privacy" },
  { label: "Money-back guarantee", href: "/legal/guarantee" },
] as const;

export const HERO = {
  eyebrow: "ERP + AI + Automation — as a Service",
  headlineTop: "Your ERP, AI Automation, and Integration Team",
  headlineAccent: "on a Monthly Plan.",
  sub: "NetSuite support, integrations, workflows, AI agents, CRM automation, and custom internal tools handled by senior consultants for one predictable monthly fee.",
  primaryCta: "Book a 15-min call",
  secondaryCta: "See plans",
  badges: [
    "Month-to-month",
    "Senior consultants",
    "Response < 1 business day",
    "Cancel anytime",
  ],
  stats: [
    { value: "7+ yrs", label: "NetSuite experience" },
    { value: "50+", label: "Automations shipped" },
    { value: "< 1 day", label: "Typical response" },
  ],
} as const;

export const STATS = [
  { value: "7+", label: "Years NetSuite experience" },
  { value: "50+", label: "Workflows & automations shipped" },
  { value: "ERP·CRM·AI", label: "Coverage across your stack" },
  { value: "< 1 day", label: "Typical response time" },
] as const;

export const SOLUTION = {
  eyebrow: "What we built instead",
  title: "A monthly technical operations team for the systems that run your business.",
  body: "Instead of hiring, scoping, and chasing invoices, you get one senior team working a shared backlog — shipping fixes, integrations, and automations every week.",
  highlights: [
    "Predictable monthly cost",
    "Senior review on every critical change",
    "No annual lock-in",
    "Backlog-driven delivery",
    "Weekly progress digest",
    "Clear documentation",
  ],
} as const;

export type ServiceGroup = { title: string; icon: string; items: string[] };

export const SERVICES = {
  eyebrow: "Services",
  title: "What we actually do",
  sub: "ERP operations, integrations, AI automation, and custom internal tools — covered by one team.",
  groups: [
    {
      title: "ERP Operations",
      icon: "database",
      items: ["NetSuite administration", "Saved searches", "Reports & dashboards", "Workflows", "Role permissions", "Custom forms"],
    },
    {
      title: "Integrations",
      icon: "plug",
      items: ["Celigo", "Shopify", "HubSpot", "Salesforce", "REST / SOAP APIs", "EDI workflows"],
    },
    {
      title: "AI Automation",
      icon: "bot",
      items: ["AI sales agents", "AI chatbots", "n8n workflows", "Lead routing", "Follow-up automation", "Telegram / Slack alerts"],
    },
    {
      title: "Custom Tools",
      icon: "layout",
      items: ["Internal portals", "CRM dashboards", "Inventory systems", "Approval tools", "Client portals", "Mini ERP apps"],
    },
  ] satisfies ServiceGroup[],
} as const;

export const STEPS = {
  eyebrow: "How it works",
  title: "A shared backlog. Clear weekly progress.",
  sub: "Onboarding in days, not months. You add requests, we ship.",
  items: [
    { n: "01", title: "Book a 15-minute call", body: "We review your systems, current issues, and backlog." },
    { n: "02", title: "Choose a monthly plan", body: "We recommend the right tier based on your workload." },
    { n: "03", title: "Start shipping tickets", body: "You add requests to the backlog, we deliver fixes, automations, and improvements." },
    { n: "04", title: "Weekly digest", body: "A clear update on what shipped, what's in progress, and what needs review." },
  ],
} as const;

export const AUDIENCE = {
  eyebrow: "Fit",
  title: "Built for teams that already have systems — but need them to work better.",
  forYou: {
    title: "A great fit if you're…",
    items: [
      "A NetSuite team after go-live",
      "An eCommerce team syncing Shopify, Lazada, Shopee, or TikTok Shop",
      "A finance team needing better reports",
      "An operations team with manual workflows",
      "A founder who needs AI automation without hiring a full team",
    ],
  },
  notForYou: {
    title: "Not the right fit for…",
    items: [
      "Full ERP implementation from zero",
      "Emergency rescue without system access",
      "AI experiments with no business process",
      "Projects with no owner on the client side",
      "Onsite-heavy engagements",
    ],
  },
} as const;

export const PRICING = {
  eyebrow: "Pricing",
  title: "Simple monthly plans. No surprise hourly invoices.",
  sub: "Pick a tier, add work to a shared backlog, and get senior delivery for one predictable fee.",
} as const;

export type Plan = {
  name: string;
  price: string;
  cadence?: string;
  bestFor: string;
  features: string[];
  featured?: boolean;
  badge?: string;
  ctaLabel: string;
};

export const PLANS: Plan[] = [
  {
    name: "Starter",
    price: "$2,499",
    cadence: "/mo",
    bestFor: "Best for small ERP teams",
    features: ["Backlog-based ERP support", "Saved searches and reports", "Workflow fixes", "Minor integrations", "Weekly progress digest"],
    ctaLabel: "Start with Starter",
  },
  {
    name: "Growth",
    price: "$3,999",
    cadence: "/mo",
    bestFor: "Best for growing operations teams",
    featured: true,
    badge: "Most Popular",
    features: ["Everything in Starter", "NetSuite + HubSpot + Shopify integrations", "Celigo / n8n workflows", "AI automation support", "Priority response"],
    ctaLabel: "Choose Growth",
  },
  {
    name: "Enterprise",
    price: "Custom",
    bestFor: "Best for complex operations",
    features: ["Dedicated delivery lead", "Multi-system architecture", "Advanced integrations", "Custom dashboards", "Security and role reviews"],
    ctaLabel: "Talk to us",
  },
];

export const SPRINT_NOTE = "Need one project? AI + Integration Sprints start at $4,999.";

export const PROOF = {
  eyebrow: "Proof",
  title: "A shared backlog you can actually see.",
  sub: "Open, In Review, and Shipped — tracked in one place, with a weekly digest summarizing everything that moved.",
  bullets: ["Active backlog with status chips", "Open / In Review / Shipped counts", "Slack-style delivery updates", "Weekly digest every Friday"],
} as const;

export const FAQS = [
  { q: "Is this only for NetSuite?", a: "No. NetSuite is our core, but we cover the surrounding stack — HubSpot, Shopify, Celigo, n8n, Salesforce, and custom internal tools." },
  { q: "Can you help with HubSpot, Shopify, or Celigo?", a: "Yes. Integrations and syncs between NetSuite, HubSpot, Shopify, and Celigo/n8n are some of the most common tickets in the backlog." },
  { q: "Do you build AI agents?", a: "Yes — AI sales agents, chatbots, lead-routing and follow-up automations, and Slack/Telegram alerting, wired into your real business processes." },
  { q: "Can we cancel anytime?", a: "Yes. Plans are month-to-month with no annual lock-in. Pause or cancel when your backlog is clear." },
  { q: "Do you work with US business hours?", a: "Yes. We operate on US business hours with a typical response under one business day." },
  { q: "Can we start with one sprint?", a: "Absolutely. AI + Integration Sprints start at $4,999 for a single scoped project before moving to a monthly plan." },
] as const;

export const FINAL_CTA = {
  eyebrow: "Get started",
  title: "Book 15 minutes. We'll tell you if SuiteVertex is a fit.",
  body: "No hard sell. We'll review your current systems, identify the best starting point, and recommend a monthly plan or one-time sprint.",
  cta: "Book intro call",
} as const;
