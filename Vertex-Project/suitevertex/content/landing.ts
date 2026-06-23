// Content for the SuiteVertex landing page. Built incrementally, section by
// section. Currently: brand, nav, and hero. (Full spec: docs/landing-page-prompt.md)

export const BRAND = {
  name: "SuiteVertex",
  tagline: "ERP, AI Automation, and Integration Work — on a Monthly Plan.",
  footerLine: "ERP, AI automation, and integration services for growing businesses.",
} as const;

export const NAV_LINKS = [
  { label: "Pricing", href: "#pricing" },
  { label: "How it Works", href: "#how-it-works" },
  { label: "Services", href: "#services" },
  { label: "FAQ", href: "#faq" },
  { label: "Contact", href: "#contact" },
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
