import { NextRequest, NextResponse } from 'next/server';
import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';

// Generates a short B2B outreach message tailored to the business type +
// product. Uses OpenAI (reads OPENAI_API_KEY from the environment).
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { businessName, businessType, services, adsNoSite, hasWebsite } = body as {
    businessName?: string;
    businessType?: string;
    services?: string[];
    adsNoSite?: boolean;
    hasWebsite?: boolean;
  };
  if (!businessName) return NextResponse.json({ error: 'businessName required' }, { status: 400 });

  const svc = Array.isArray(services) ? services : [];
  const offerMap: Record<string, string> = {
    website: 'a professional website / landing page',
    gbp: 'Google Business Profile optimization (more reviews + visibility on Google Maps)',
    seo: 'SEO to rank higher on Google',
  };
  const offers = svc.map((s) => offerMap[s]).filter(Boolean);
  const gapLine = adsNoSite
    ? 'IMPORTANT ANGLE: they appear to run ads but have NO website — point out (politely) that ad clicks are wasted without a proper landing page, and offer to build one.'
    : !hasWebsite
    ? 'ANGLE: they have no website — lead with how a simple professional website/landing page builds trust and captures customers searching online.'
    : 'ANGLE: they have a website — lead with getting more customers via Google Business Profile + SEO (more reviews, higher Google ranking).';

  const system = [
    'You are a sales rep for Vertex AI Marketing — we build websites/landing pages, optimize Google Business Profiles, and do SEO for Philippine SMBs.',
    'Write a short (80-130 words), warm, NON-pushy cold outreach message in natural Taglish (English + Filipino).',
    'Start with a specific, genuine observation about THIS business, then connect it to the most relevant service.',
    offers.length ? `Focus on these services for this prospect: ${offers.join('; ')}.` : 'Focus on website, Google Business, and SEO.',
    gapLine,
    'End with a soft call-to-action (a quick free audit or chat). Output format EXACTLY:\nSUBJECT: <one line>\nBODY:\n<body>',
  ].join(' ');

  const prompt = `Business: ${businessName}\nType: ${businessType ?? 'SMB'}\nHas website: ${hasWebsite ? 'yes' : 'no'}\nRuns ads: ${adsNoSite ? 'yes (but no website)' : 'unknown'}`;

  try {
    const { text } = await generateText({
      // Model is env-configurable so you can move to a newer OpenAI model
      // (e.g. OPENAI_MODEL=gpt-5.4) without a code change.
      model: openai(process.env.OPENAI_MODEL ?? 'gpt-4o-mini'),
      system,
      prompt,
      maxOutputTokens: 400,
    });
    const subjMatch = text.match(/SUBJECT:\s*(.+)/i);
    const bodyMatch = text.match(/BODY:\s*([\s\S]+)/i);
    const subject = (subjMatch?.[1] ?? 'More customers for your business').trim();
    const bodyText = (bodyMatch?.[1] ?? text).trim();
    return NextResponse.json({ subject, body: bodyText });
  } catch (err) {
    console.error('[outreach/compose] failed:', err);
    return NextResponse.json({ error: 'compose failed' }, { status: 502 });
  }
}
