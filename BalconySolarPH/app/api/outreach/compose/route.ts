import { NextRequest, NextResponse } from 'next/server';
import { generateText } from 'ai';

// Generates a short B2B solar outreach message tailored to the business type +
// product. Uses Claude via the Vercel AI Gateway (model string "provider/model").
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { businessName, businessType, product } = body as {
    businessName?: string;
    businessType?: string;
    product?: string;
  };
  if (!businessName) return NextResponse.json({ error: 'businessName required' }, { status: 400 });

  const system = [
    'Ikaw ay sales rep ng Balcony Solar PH na nagbebenta ng murang plug-in solar sa maliliit na negosyo sa Pilipinas.',
    'Sumulat ng maikli (80-120 words), magalang, Taglish na cold outreach email.',
    'Naka-angkop sa uri ng negosyo ang benepisyo (hal. resto = bawas sa kuryente ng aircon/kitchen).',
    'Banggitin ang produkto. Magtapos ng simpleng call-to-action (libreng assessment).',
    'Output format EXACTLY:\nSUBJECT: <one line>\nBODY:\n<body>',
  ].join(' ');

  const prompt = `Business: ${businessName}\nType: ${businessType ?? 'SMB'}\nProduct: ${product ?? 'Balcony Solar Kit'}`;

  try {
    const { text } = await generateText({
      model: 'anthropic/claude-sonnet-4.6',
      system,
      prompt,
      maxOutputTokens: 400,
    });
    const subjMatch = text.match(/SUBJECT:\s*(.+)/i);
    const bodyMatch = text.match(/BODY:\s*([\s\S]+)/i);
    const subject = (subjMatch?.[1] ?? 'Solar savings para sa inyong negosyo').trim();
    const bodyText = (bodyMatch?.[1] ?? text).trim();
    return NextResponse.json({ subject, body: bodyText });
  } catch (err) {
    console.error('[outreach/compose] failed:', err);
    return NextResponse.json({ error: 'compose failed' }, { status: 502 });
  }
}
