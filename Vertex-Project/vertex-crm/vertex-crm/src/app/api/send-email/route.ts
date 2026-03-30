import { NextRequest, NextResponse } from 'next/server'
import { getGmailClient, buildMimeEmail, encodeEmail } from '@/lib/google'
import { updateLastContacted } from '@/lib/sheets'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

/**
 * POST /api/send-email
 * Body: { to, toName, subject, body, leadId?, sheetRow? }
 *
 * Sends via Gmail API using the logged-in user's account.
 * Updates `last_contacted` in Google Sheets after sending.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { to, toName, subject, body, leadId, sheetRow } = await req.json()
    if (!to || !subject || !body) {
      return NextResponse.json({ error: 'Missing required fields: to, subject, body' }, { status: 400 })
    }

    const gmail = await getGmailClient()

    // Build HTML email with Vertex AI Marketing branding
    const htmlBody = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;background:#09090f;margin:0;padding:40px 20px">
  <div style="max-width:560px;margin:0 auto">
    <div style="background:#0f0f1a;border:1px solid rgba(148,163,184,0.1);border-radius:12px;overflow:hidden">
      <div style="background:#0f0f1a;border-bottom:1px solid rgba(59,130,246,0.3);padding:20px 28px;display:flex;align-items:center;gap:10px">
        <div style="width:28px;height:28px;background:#3b82f6;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:14px;color:white;font-weight:700">V</div>
        <span style="font-size:13px;font-weight:600;color:#e2e8f0">Vertex AI Marketing</span>
      </div>
      <div style="padding:28px;color:#e2e8f0;font-size:15px;line-height:1.7">
        ${body.replace(/\n/g, '<br>')}
      </div>
      <div style="padding:16px 28px;border-top:1px solid rgba(148,163,184,0.08);text-align:center">
        <p style="font-size:11px;color:#475569;margin:0">Vertex AI Marketing · Marilao, Bulacan, Philippines</p>
        <p style="font-size:11px;color:#475569;margin:4px 0 0"><a href="https://vertexaimarketing.cloud" style="color:#3b82f6;text-decoration:none">vertexaimarketing.cloud</a></p>
      </div>
    </div>
  </div>
</body>
</html>`

    const rawMime = buildMimeEmail({
      from:     session.user.email,
      fromName: 'Angelo Franco | Vertex AI Marketing',
      to,
      toName,
      subject,
      body:     htmlBody,
      replyTo:  session.user.email,
    })

    const result = await gmail.users.messages.send({
      userId: 'me',
      requestBody: { raw: encodeEmail(rawMime) },
    })

    // Update Google Sheets CRM
    if (sheetRow) {
      await updateLastContacted(sheetRow)
    }

    return NextResponse.json({
      success: true,
      messageId: result.data.id,
      threadId:  result.data.threadId,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[API /send-email]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

/**
 * GET /api/send-email?leadId=xxx
 * Returns recent email threads related to a lead (searches Gmail)
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url   = new URL(req.url)
    const email = url.searchParams.get('email')
    if (!email) return NextResponse.json({ threads: [] })

    const gmail = await getGmailClient()
    const list  = await gmail.users.messages.list({
      userId: 'me',
      q: `to:${email} OR from:${email}`,
      maxResults: 10,
    })

    const messages = await Promise.all(
      (list.data.messages || []).slice(0, 10).map(async (m) => {
        const msg = await gmail.users.messages.get({
          userId: 'me', id: m.id!, format: 'metadata',
          metadataHeaders: ['From', 'To', 'Subject', 'Date'],
        })
        const headers = msg.data.payload?.headers || []
        const get = (name: string) => headers.find(h => h.name === name)?.value || ''
        return {
          id:       msg.data.id,
          threadId: msg.data.threadId,
          subject:  get('Subject'),
          from:     get('From'),
          date:     get('Date'),
          snippet:  msg.data.snippet,
          read:     !msg.data.labelIds?.includes('UNREAD'),
        }
      })
    )

    return NextResponse.json({ threads: messages })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
