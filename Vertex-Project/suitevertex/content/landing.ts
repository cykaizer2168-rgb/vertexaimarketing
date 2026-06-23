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
