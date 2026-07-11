// ============================================================================
// Vertex AI Marketing — product knowledge base for the Messenger AI agent.
//
// EDIT ME. The agent is grounded to this content and is told NOT to invent
// anything outside it (especially pricing). Fill in exact packages/prices below.
// ============================================================================

export interface Service {
  name: string;
  blurb: string;
}

export interface Package {
  name: string;
  tagline: string;
  priceFrom: string; // "starting at" — agent may quote this; exact total after a scope call
  includes: string[];
}

export const VERTEX_KB = {
  // One-liner used in the agent's introduction.
  intro:
    'Vertex AI Marketing helps Philippine businesses get more customers online — ' +
    'websites & landing pages, Google Business Profile, SEO, and AI-powered lead ' +
    'systems (Messenger/ads automation) that capture and follow up leads for you.',

  services: [
    { name: 'Websites & Landing Pages', blurb: 'Professional, fast, conversion-focused sites that turn visitors into inquiries.' },
    { name: 'Google Business Profile', blurb: 'Optimization + more reviews so you show up on Google Maps and local search.' },
    { name: 'SEO', blurb: 'Rank higher on Google for what your customers are searching.' },
    { name: 'Lead & Messenger Automation', blurb: 'AI that qualifies FB Messenger and ad leads 24/7 and hands hot ones to your team.' },
    { name: 'Meta / Google Ads', blurb: 'Managed ad campaigns wired straight into your CRM so no lead is lost.' },
  ] as Service[],

  valueProps: [
    'Built for PH SMBs — Taglish support, GCash-friendly, local market know-how.',
    'Everything feeds one CRM: capture → follow-up → close, fully tracked.',
    'First response in under 60 seconds via automation — speed wins deals.',
  ],

  // ⚠️ DRAFT PRICING — replace with Vertex's real numbers. These are "starting
  // at" figures the agent may quote; the exact total is confirmed on a short
  // scope call. Currency: PHP. Setup = one-time; retainer = per month.
  packages: [
    {
      name: 'Starter — Get Found',
      tagline: 'For businesses that need a proper online presence.',
      priceFrom: 'from ₱25,000 one-time',
      includes: [
        'Professional landing page (mobile-first, fast)',
        'Google Business Profile setup + optimization',
        'Lead form wired to the CRM',
      ],
    },
    {
      name: 'Growth — Get Leads',
      tagline: 'For businesses that want a steady flow of inquiries.',
      priceFrom: 'from ₱18,000 / month (+ setup)',
      includes: [
        'Everything in Starter',
        'FB Messenger + ad-lead automation (AI qualifies 24/7)',
        'SEO foundations',
        'Automated follow-up sequences',
      ],
    },
    {
      name: 'Scale — Full Growth Engine',
      tagline: 'Done-for-you marketing + sales system.',
      priceFrom: 'from ₱35,000 / month (custom)',
      includes: [
        'Everything in Growth',
        'Managed Meta / Google Ads (ad spend billed separately)',
        'Full CRM pipeline + reporting',
        'Priority support + monthly strategy call',
      ],
    },
  ] as Package[],

  // Short FAQ the agent may answer from. Keep answers truthful; if something is
  // not here, the agent asks to connect the person with a specialist.
  faq: [
    {
      q: 'How much / magkano?',
      a: 'May tatlong package kami: Starter (Get Found) from ₱25k one-time, Growth (Get Leads) from ₱18k/month, at Scale (Full Growth Engine) from ₱35k/month. Depende sa scope ang exact total — mabilis lang i-confirm sa isang chat, walang hidden fees.',
    },
    {
      q: 'Do you handle everything or DIY?',
      a: 'Fully done-for-you. We build, launch, and manage; you just get the leads and reports.',
    },
    {
      q: 'How fast to launch?',
      a: 'A landing page can go live in about a week; automation setup is usually a few days after we align on scope.',
    },
  ],

  // Anything the agent must never do.
  guardrails: [
    'Only quote the "from / starting at" package prices above — never invent other numbers, discounts, guarantees, or timelines.',
    'Always frame price as "starting at" and note the exact total is confirmed on a short scope call.',
    'Never promise specific rankings or revenue numbers.',
    'If unsure or out of scope, offer to connect the person to a specialist.',
  ],
} as const;

export type VertexKB = typeof VERTEX_KB;
