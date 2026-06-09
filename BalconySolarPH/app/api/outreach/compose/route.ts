import { NextRequest, NextResponse } from 'next/server';
import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';

// Generates a short B2B solar outreach message tailored to the business type +
// product. Uses OpenAI (reads OPENAI_API_KEY from the environment).
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { businessName, businessType, product } = body as {
    businessName?: string;
    businessType?: string;
    product?: string;
  };
  if (!businessName) return NextResponse.json({ error: 'businessName required' }, { status: 400 });

  const system = [
    'You are a sales rep for Balcony Solar PH selling affordable plug-in solar to small businesses in the Philippines.',
    'Write a short (80-120 words), polite, professional cold outreach email in English.',
    'Tailor the benefit to the business type (e.g. a restaurant = lower electricity bills from aircon and kitchen load).',
    'Mention the product. End with a simple call-to-action (a free assessment).',
    'Output format EXACTLY:\nSUBJECT: <one line>\nBODY:\n<body>',
  ].join(' ');

  const prompt = `Business: ${businessName}\nType: ${businessType ?? 'SMB'}\nProduct: ${product ?? 'Balcony Solar Kit'}`;

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
    const subject = (subjMatch?.[1] ?? 'Solar savings for your business').trim();
    const bodyText = (bodyMatch?.[1] ?? text).trim();
    return NextResponse.json({ subject, body: bodyText });
  } catch (err) {
    console.error('[outreach/compose] failed:', err);
    return NextResponse.json({ error: 'compose failed' }, { status: 502 });
  }
}
