import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { readSettings } from '@/lib/settings'

/**
 * POST /api/ai-compose
 * Body: { prompt, lead: { name, company, industry, painPoints, suggestedAutomation, estimatedValue } }
 *
 * Sends the prompt + lead context to n8n, which calls Claude and returns:
 *   { subject: string, body: string }
 *
 * The n8n webhook MUST be configured as "Respond when last node finishes"
 * and the last node must return JSON with subject + body.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { prompt, lead } = await req.json()
    if (!prompt?.trim()) {
      return NextResponse.json({ error: 'prompt is required' }, { status: 400 })
    }

    const settings = await readSettings()

    // Use dedicated AI compose webhook if set, otherwise fall back to main webhook
    const webhookUrl = (settings as unknown as Record<string, string>).aiComposeWebhook || settings.webhookUrl
    if (!webhookUrl) {
      return NextResponse.json({ error: 'No webhook URL configured in Settings' }, { status: 400 })
    }

    const res = await fetch(webhookUrl, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type:      'ai_compose',
        prompt,
        lead:      lead || {},
        sender:    session.user.email,
        timestamp: new Date().toISOString(),
      }),
    })

    if (!res.ok) {
      const text = await res.text()
      throw new Error(`n8n returned ${res.status}: ${text.slice(0, 200)}`)
    }

    const data = await res.json()

    // n8n can return the result in various shapes — normalise them
    const subject = data?.subject || data?.output?.subject || data?.[0]?.subject || ''
    const body    = data?.body    || data?.output?.body    || data?.[0]?.body    || data?.output || ''

    if (!body) {
      throw new Error('n8n returned a response but no email body was found. Check your n8n workflow output.')
    }

    return NextResponse.json({ subject, body })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[API /ai-compose]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
