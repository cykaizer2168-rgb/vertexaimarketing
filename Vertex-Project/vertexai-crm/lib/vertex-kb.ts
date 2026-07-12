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

  // REAL PRICING — matches the live FB Messenger agent. Quote these EXACT prices;
  // do NOT invent others. All packages include FB Messenger integration + 1 Year
  // Free Domain. Currency: PHP, one-time setup.
  packages: [
    {
      name: 'BASIC',
      tagline: 'Landing page funnel + lead capture to start getting inquiries.',
      priceFrom: '₱5,000',
      includes: [
        'Landing page funnel setup',
        'Lead capture system + clear conversion structure',
        'FB Page Messenger integration',
        'Payment gateway setup if needed (Card/PayPal)',
        '1 Year Free Domain',
      ],
    },
    {
      name: 'STANDARD',
      tagline: 'Basic + paid traffic to drive more leads.',
      priceFrom: '₱6,990',
      includes: [
        'Everything in Basic',
        'FB Ads setup (2 free creatives)',
      ],
    },
    {
      name: 'PREMIUM',
      tagline: 'Full funnel with booking + follow-up automation.',
      priceFrom: '₱10,000',
      includes: [
        'Everything in Standard',
        'Appointment Booking System + online Zoom booking presentation',
        'Calendar Booking',
        'Email follow-up automation (3 editable sequences)',
      ],
    },
  ] as Package[],

  // Short FAQ the agent may answer from. Keep answers truthful; if something is
  // not here, the agent asks to connect the person with a specialist.
  faq: [
    {
      q: 'How much / magkano?',
      a: 'May tatlong package kami: BASIC ₱5,000 (landing page funnel + lead capture), STANDARD ₱6,990 (Basic + FB Ads, 2 free creatives), at PREMIUM ₱10,000 (Standard + appointment/Zoom booking + email follow-up automation). Lahat may FB Messenger integration + 1 Year Free Domain. Pwede mag-start sa Basic, upgrade anytime — walang hidden fees.',
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
    'Quote the EXACT package prices above (₱5,000 / ₱6,990 / ₱10,000) — never invent other numbers, custom discounts, guarantees, or timelines.',
    'The moment someone asks price/cost/budget/"magkano", state the exact peso amount of the relevant package immediately — never say the quote is only on a call.',
    'Map need → package: booking/Zoom/email follow-up → PREMIUM ₱10,000; FB ads/creatives → STANDARD ₱6,990; landing page + leads → BASIC ₱5,000. Suggest "start with Basic, upgrade anytime."',
    'Never promise specific rankings or revenue numbers.',
    'If unsure or out of scope, offer to connect the person to a specialist.',
  ],
} as const;

export type VertexKB = typeof VERTEX_KB;
