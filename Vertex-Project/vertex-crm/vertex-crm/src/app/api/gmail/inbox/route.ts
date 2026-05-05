import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getGmailClient } from '@/lib/google'

function parseFrom(from: string): { name: string; email: string } {
  const match = from.match(/^"?([^"<]*)"?\s*<?([^>]+)>?$/)
  if (match) {
    return { name: match[1].trim(), email: match[2].trim().toLowerCase() }
  }
  return { name: '', email: from.trim().toLowerCase() }
}

function extractBody(part: {
  mimeType?: string | null
  body?: { data?: string | null } | null
  parts?: unknown[] | null
}): { text: string; isHtml: boolean } {
  if (part.body?.data) {
    const text = Buffer.from(part.body.data, 'base64').toString('utf-8')
    return { text, isHtml: part.mimeType === 'text/html' }
  }
  if (part.parts && Array.isArray(part.parts)) {
    const subparts = part.parts as typeof part[]
    // Prefer text/plain
    const plain = subparts.find(p => p.mimeType === 'text/plain')
    if (plain) return extractBody(plain)
    // Fallback to text/html
    const html = subparts.find(p => p.mimeType === 'text/html')
    if (html) return extractBody(html)
    // Recurse through multipart
    for (const p of subparts) {
      const result = extractBody(p)
      if (result.text) return result
    }
  }
  return { text: '', isHtml: false }
}

/**
 * GET /api/gmail/inbox
 * Returns recent inbox messages (metadata only, fast).
 *
 * GET /api/gmail/inbox?msgId=xxx
 * Returns full message body for the given ID.
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const gmail = await getGmailClient()
    const url   = new URL(req.url)
    const msgId = url.searchParams.get('msgId')

    // ── Full message body ──────────────────────────────────────────────────
    if (msgId) {
      const msg = await gmail.users.messages.get({
        userId: 'me',
        id:     msgId,
        format: 'full',
      })

      const headers = msg.data.payload?.headers || []
      const get = (name: string) => headers.find(h => h.name === name)?.value || ''

      const { text, isHtml } = extractBody(
        msg.data.payload as Parameters<typeof extractBody>[0] ?? {}
      )

      // Mark as read
      if (msg.data.labelIds?.includes('UNREAD')) {
        await gmail.users.messages.modify({
          userId: 'me',
          id:     msgId,
          requestBody: { removeLabelIds: ['UNREAD'] },
        }).catch(() => { /* non-fatal */ })
      }

      return NextResponse.json({
        id:       msg.data.id,
        threadId: msg.data.threadId,
        subject:  get('Subject'),
        from:     get('From'),
        to:       get('To'),
        date:     get('Date'),
        body:     text,
        isHtml,
        read:     true,
      })
    }

    // ── Inbox / Sent list ──────────────────────────────────────────────────
    const box    = url.searchParams.get('box') // 'inbox' | 'sent'
    const label  = box === 'sent' ? 'SENT' : 'INBOX'
    const list   = await gmail.users.messages.list({
      userId:    'me',
      labelIds:  [label],
      maxResults: 40,
    })

    const ids = (list.data.messages || []).slice(0, 40)
    if (!ids.length) return NextResponse.json({ messages: [] })

    // Parallel metadata fetch
    const messages = await Promise.all(
      ids.map(async m => {
        const msg = await gmail.users.messages.get({
          userId:          'me',
          id:              m.id!,
          format:          'metadata',
          metadataHeaders: ['From', 'To', 'Subject', 'Date'],
        })
        const headers = msg.data.payload?.headers || []
        const get = (name: string) => headers.find(h => h.name === name)?.value || ''
        const rawFrom = get('From')
        const rawTo   = get('To')
        const { name: fromName, email: fromEmail } = parseFrom(rawFrom)
        const { name: toName,   email: toEmail }   = parseFrom(rawTo)
        return {
          id:        msg.data.id,
          threadId:  msg.data.threadId,
          subject:   get('Subject') || '(no subject)',
          from:      rawFrom,
          fromName:  fromName || fromEmail,
          fromEmail,
          to:        rawTo,
          toName:    toName || toEmail,
          toEmail,
          date:      get('Date'),
          snippet:   msg.data.snippet || '',
          read:      !msg.data.labelIds?.includes('UNREAD'),
          isSent:    label === 'SENT',
        }
      })
    )

    return NextResponse.json({ messages })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[API /gmail/inbox]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
