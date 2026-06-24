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
  headlineTop: "Run Your Operations with AI.",
  headlineAccent: "Not More Headcount.",
  sub: "SuiteVertex combines ERP expertise, AI automation, integrations, and custom operations support into one monthly subscription.",
  primaryCta: "Book a 15-min call",
  secondaryCta: "See plans",
  badges: [
    "Month-to-month",
    "Senior consultants",
    "Response < 1 business day",
    "Cancel anytime",
  ],
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

export type ServiceGroup = { title: string; icon: string; items: string[] };

export const SERVICES = {
  eyebrow: "Capabilities",
  title: "What your NetSuite copilot can do",
  sub: "24/7, role-based help grounded in your business processes and policies — from troubleshooting live issues to reading audit trails.",
  groups: [
    {
      title: "Troubleshoot live issues",
      icon: "wrench",
      items: [
        "Bank rec: matched lines that won't clear",
        "Period close & posting errors",
        "Workflows that aren't triggering",
        "Step-by-step fixes for your exact setup",
      ],
    },
    {
      title: "Saved searches & reports",
      icon: "search",
      items: [
        "Explain and fix saved searches",
        "Build the report you actually need",
        "Diagnose why results look wrong",
        "Scheduled / emailed report issues",
      ],
    },
    {
      title: "Audit trail & system notes",
      icon: "history",
      items: [
        "Who changed this record, and when",
        "Reads System Notes to trace changes",
        "Finds the source of data discrepancies",
        "Reconciles unexpected values",
      ],
    },
    {
      title: "Role-based & secure",
      icon: "shield",
      items: [
        "Answers respect each user's NetSuite role",
        "Financial data gated by permission",
        "No exposure of restricted information",
        "Read-first, audit-friendly",
      ],
    },
  ] satisfies ServiceGroup[],
  examplesLabel: "Try asking your copilot",
  examples: [
    "Why won't this reconciled bank line clear from the match list?",
    "Build a saved search for overdue purchase orders",
    "Who changed this customer's credit limit, and when?",
    "Why is my A/R aging report off this month?",
  ],
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
