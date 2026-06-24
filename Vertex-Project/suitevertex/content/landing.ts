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
  eyebrow: "Implementation · Managed Services · AI Copilot",
  headlineTop: "Your complete NetSuite team.",
  headlineAccent: "Humans + AI.",
  sub: "We implement NetSuite, run it month to month, and put an AI copilot inside it that answers 24/7 from your real business processes and policies — not generic SuiteAnswers.",
  primaryCta: "Book a 15-min call",
  secondaryCta: "See what we do",
  badges: ["Inside NetSuite", "24/7 support", "Senior-reviewed", "Month-to-month"],
} as const;

export type TrustItem = { name: string; logo?: string };

export const TRUST = {
  label: "Works with",
  items: [
    { name: "NetSuite", logo: "/logos/netsuite.png" },
    { name: "Shopify", logo: "/logos/shopify.png" },
    { name: "HubSpot", logo: "/logos/hubspot.png" },
    { name: "Salesforce", logo: "/logos/salesforce.png" },
    { name: "Celigo", logo: "/logos/celigo.png" },
    { name: "Slack", logo: "/logos/slack.png" },
  ] satisfies TrustItem[],
} as const;

export const WHY_DIFFERENT = {
  eyebrow: "Why we're different",
  headlineLead: "We're not an agency.",
  headlineSub: "We're not a staffing firm either.",
  copy: [
    "SuiteVertex sits between consulting and execution.",
    "You get a senior team that manages ERP systems, integrations, AI automations, reporting, and operational workflows through one predictable monthly engagement.",
  ],
  metrics: [
    { value: "70%+", label: "Lower cost than building an internal team" },
    { value: "100%", label: "Senior-reviewed deliverables" },
    { value: "0", label: "Annual contracts" },
  ],
} as const;

export type ServiceGroup = { title: string; icon: string; tag?: string; items: string[] };

export const SERVICES = {
  eyebrow: "What we do",
  title: "We build it. We run it. We make it smarter.",
  sub: "One partner across the full NetSuite lifecycle — from go-live, to day-to-day operations, to an AI copilot inside your account.",
  groups: [
    {
      title: "NetSuite Implementation",
      tag: "Build",
      icon: "rocket",
      items: [
        "New implementations & go-lives",
        "Module rollouts",
        "Data migration",
        "Customizations & scripting",
        "Process design & training",
      ],
    },
    {
      title: "NetSuite Managed Services",
      tag: "Run",
      icon: "settings",
      items: [
        "Backlog-driven admin & support",
        "Saved searches, reports, dashboards",
        "Workflows, forms, roles",
        "Integrations & fixes",
        "Weekly progress digest",
      ],
    },
    {
      title: "NetSuite Copilot",
      tag: "Smarter",
      icon: "bot",
      items: [
        "24/7 AI support inside NetSuite",
        "Grounded in your processes & policies",
        "Troubleshoots real issues",
        "Role-based & secure",
      ],
    },
  ] satisfies ServiceGroup[],
} as const;

export type CopilotCapability = { title: string; icon: string; desc: string };

export const COPILOT = {
  eyebrow: "Product · NetSuite Copilot",
  title: "Activate a NetSuite Copilot that knows your business.",
  sub: "An AI copilot inside NetSuite that answers 24/7 from your actual business processes and company policies — not just generic SuiteAnswers. Role-based, and backed by senior consultants.",
  capabilities: [
    {
      title: "Troubleshoots live issues",
      icon: "wrench",
      desc: "Bank rec lines that won't clear, period-close errors, workflows that don't fire — diagnosed against your real setup.",
    },
    {
      title: "Saved searches & reports",
      icon: "search",
      desc: "Explains, fixes, and builds the saved searches and reports your team needs.",
    },
    {
      title: "Audit trail & system notes",
      icon: "history",
      desc: "Reads System Notes to show who changed what and when, and traces data discrepancies.",
    },
    {
      title: "Role-based & secure",
      icon: "shield",
      desc: "Answers respect each user's NetSuite role; financial data stays gated by permission.",
    },
  ] satisfies CopilotCapability[],
  examplesLabel: "Try asking your copilot",
  examples: [
    "Why won't this reconciled bank line clear from the match list?",
    "Build a saved search for overdue purchase orders",
    "Who changed this customer's credit limit, and when?",
    "Why is my A/R aging report off this month?",
  ],
} as const;

export type SuccessModule = { title: string; icon: string; desc: string };

export const SUCCESS_CENTER = {
  eyebrow: "Success Center",
  title: "Everything your team needs, in one Success Center.",
  sub: "Tickets, answers, diagnostics, your SOPs, and training — one place that keeps NetSuite running smoothly.",
  modules: [
    {
      title: "Support Tickets",
      icon: "ticket",
      desc: "Submit and track NetSuite requests in one shared backlog, senior-reviewed.",
    },
    {
      title: "Knowledge Base",
      icon: "book",
      desc: "Searchable answers grounded in your setup — beyond generic SuiteAnswers.",
    },
    {
      title: "AI Diagnostics",
      icon: "activity",
      desc: "The copilot pinpoints root causes using System Notes and audit trails.",
    },
    {
      title: "SOP Library",
      icon: "library",
      desc: "Your business processes and policies, kept current and used to ground the copilot.",
    },
    {
      title: "Training Center",
      icon: "graduation",
      desc: "Role-based guides and onboarding so your team ramps up fast.",
    },
  ] satisfies SuccessModule[],
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
