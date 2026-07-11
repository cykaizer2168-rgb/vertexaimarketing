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

  // Short FAQ the agent may answer from. Keep answers truthful; if something is
  // not here, the agent asks to connect the person with a specialist.
  faq: [
    {
      q: 'How much / magkano?',
      // TODO: replace with real packages/pricing. Until then the agent will
      // NOT quote a number and will offer a quick call/custom quote instead.
      a: 'Pricing depends on scope. A specialist gives a tailored quote after a short chat — walang hidden fees.',
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
    'Never invent prices, guarantees, or timelines not stated above.',
    'Never promise specific rankings or revenue numbers.',
    'If unsure or out of scope, offer to connect the person to a specialist.',
  ],
} as const;

export type VertexKB = typeof VERTEX_KB;
