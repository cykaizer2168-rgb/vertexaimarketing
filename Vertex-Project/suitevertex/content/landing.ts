// Content for the SuiteVertex landing page. Built incrementally, section by
// section. Currently: brand, nav, and hero. (Full spec: docs/landing-page-prompt.md)

export const BRAND = {
  name: "SuiteVertex",
  tagline: "ERP, AI Automation, and Integration Work — on a Monthly Plan.",
  footerLine: "ERP, AI automation, and integration services for growing businesses.",
} as const;

export const NAV_LINKS = [
  { label: "Pricing", href: "/pricing" },
  { label: "How it Works", href: "/#how-it-works" },
  { label: "Services", href: "/#services" },
  { label: "FAQ", href: "/#faq" },
  { label: "Contact", href: "/#contact" },
] as const;

export const FOOTER_LINKS = [
  { label: "Pricing", href: "/pricing" },
  { label: "Services", href: "/#services" },
  { label: "How it Works", href: "/#how-it-works" },
  { label: "Contact", href: "/#contact" },
] as const;

export const HERO = {
  eyebrow: "ERP + AI + Automation — as a Service",
  headline: "Your ERP, AI Automation, and Integration Team — on a Monthly Plan.",
  sub: "NetSuite support, integrations, workflows, AI agents, CRM automation, and custom internal tools handled by senior consultants for one predictable monthly fee.",
  primaryCta: "Book a 15-min call",
  secondaryCta: "See plans",
  badges: [
    "Month-to-month",
    "Senior ERP + automation consultants",
    "Typical response under 1 business day",
    "Cancel anytime",
  ],
} as const;

export const PRICING = {
  eyebrow: "Pricing",
  title: "Simple monthly plans. No surprise hourly invoices.",
  subtitle:
    "Pick a tier, add work to a shared backlog, and get senior delivery for one predictable monthly fee.",
} as const;

export type Plan = {
  name: string;
  price: string;
  cadence?: string;
  bestFor: string;
  features: string[];
  featured?: boolean;
  ctaLabel: string;
};

export const PLANS: Plan[] = [
  {
    name: "Starter",
    price: "$2,499",
    cadence: "/mo",
    bestFor: "Best for small ERP teams",
    features: [
      "Backlog-based ERP support",
      "Saved searches and reports",
      "Workflow fixes",
      "Minor integrations",
      "Weekly progress digest",
    ],
    ctaLabel: "Start with Starter",
  },
  {
    name: "Growth",
    price: "$3,999",
    cadence: "/mo",
    bestFor: "Best for growing operations teams",
    featured: true,
    features: [
      "Everything in Starter",
      "NetSuite + HubSpot + Shopify integrations",
      "Celigo / n8n workflows",
      "AI automation support",
      "Priority response",
    ],
    ctaLabel: "Choose Growth",
  },
  {
    name: "Enterprise",
    price: "Custom",
    bestFor: "Best for complex operations",
    features: [
      "Dedicated delivery lead",
      "Multi-system architecture",
      "Advanced integrations",
      "Custom dashboards",
      "Security and role reviews",
    ],
    ctaLabel: "Talk to us",
  },
];

export const SPRINT_NOTE =
  "Need one project? AI + Integration Sprints start at $4,999.";

export type ProblemOption = {
  label: string;
  icon: "hire" | "firm" | "freelance";
  title: string;
  body: string;
  price: string;
  priceNote: string;
};

export const PROBLEM = {
  eyebrow: "How most teams handle this today",
  titleLead: "The usual options are",
  titleEmphasis: "expensive, slow, or risky.",
  paragraph:
    "Most growing teams have already tried one of these options. Usually two. Sometimes all three, before they realize they need a more reliable way to manage ERP, integrations, AI automation, and reporting.",
  options: [
    {
      label: "Option A · Hire someone",
      icon: "hire",
      title: "Hire an ERP admin",
      body: "Finding someone who understands ERP, integrations, reporting, workflows, and automation takes months. One person usually cannot cover everything.",
      price: "$120K–$180K",
      priceNote: "/yr fully loaded",
    },
    {
      label: "Option B · Hourly firm",
      icon: "firm",
      title: "Retain a consultancy",
      body: "The work can be good, but every small request becomes a scope discussion, change order, and surprise invoice.",
      price: "$125–$350",
      priceNote: "/hr before markup",
    },
    {
      label: "Option C · Random contractors",
      icon: "freelance",
      title: "Shop on freelance sites",
      body: "Sometimes you get lucky. But quality varies, documentation is inconsistent, and support disappears when something breaks.",
      price: "~$25–$60",
      priceNote: "/hr quality varies",
    },
  ] satisfies ProblemOption[],
  strip: {
    eyebrow: "What we built instead",
    headline: "A monthly plan. One senior team. Clear delivery every week.",
    middle: "Predictable invoice. No change-order theatre. Cancel any month you want.",
    price: "$2,499",
    priceNote: "/mo",
  },
} as const;
