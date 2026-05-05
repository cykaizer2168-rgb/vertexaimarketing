import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { readSettings } from '@/lib/settings'
import { ImapFlow } from 'imapflow'

const IMAP_HOST = 'imap.hostinger.com'
const IMAP_PORT = 993

function parseFrom(from: string): { name: string; email: string } {
  const match = from.match(/^"?([^"<]*)"?\s*<?([^>]+)>?$/)
  if (match) return { name: match[1].trim(), email: match[2].trim().toLowerCase() }
  return { name: '', email: from.trim().toLowerCase() }
}

async function getImapClient(email: string, password: string) {
  const client = new ImapFlow({
    host:   IMAP_HOST,
    port:   IMAP_PORT,
    secure: true,
    auth:   { user: email, pass: password },
    logger: false,
  })
  await client.connect()
  return client
}

/**
 * GET /api/mail/inbox?box=inbox|sent   — list messages
 * GET /api/mail/inbox?msgId=xxx        — get full message body
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const settings = await readSettings()
    const { hostingerEmail, hostingerPassword } = settings

    if (!hostingerEmail || !hostingerPassword) {
      return NextResponse.json({ error: 'Hostinger email not configured in Settings' }, { status: 400 })
    }

    const url   = new URL(req.url)
    const msgId = url.searchParams.get('msgId')
    const box   = url.searchParams.get('box') === 'sent' ? 'Sent' : 'INBOX'

    const client = await getImapClient(hostingerEmail, hostingerPassword)

    try {
      // ── Full message ───────────────────────────────────────────────────────
      if (msgId) {
        const lock = await client.getMailboxLock(box)
        let result = null
        try {
          const msg = await client.fetchOne(msgId, {
            envelope: true,
            bodyStructure: true,
            source: true,
          })

          if (msg && msg.source && msg.envelope) {
            const raw      = msg.source.toString('utf-8')
            const envelope = msg.envelope

            // Extract body from raw source — find double newline then grab text
            const bodyStart = raw.indexOf('\r\n\r\n')
            let body = bodyStart !== -1 ? raw.slice(bodyStart + 4) : raw

            // Basic base64 decode if content-transfer-encoding is base64
            if (raw.toLowerCase().includes('content-transfer-encoding: base64')) {
              try {
                const b64 = body.replace(/\s/g, '')
                body = Buffer.from(b64, 'base64').toString('utf-8')
              } catch { /* keep raw */ }
            }

            // Strip HTML tags for plain display
            const isHtml = raw.toLowerCase().includes('content-type: text/html')

            result = {
              id:       msgId,
              subject:  envelope.subject || '(no subject)',
              from:     envelope.from?.[0]?.address || '',
              fromName: envelope.from?.[0]?.name || envelope.from?.[0]?.address || '',
              to:       envelope.to?.[0]?.address || '',
              date:     envelope.date?.toISOString() || '',
              body,
              isHtml,
              read:     true,
            }
          }
        } finally {
          lock.release()
        }
        await client.logout()
        return NextResponse.json(result || { error: 'Message not found' })
      }

      // ── Message list ───────────────────────────────────────────────────────
      const lock = await client.getMailboxLock(box)
      const messages: object[] = []

      try {
        // Fetch latest 40 messages
        const mailbox = client.mailbox
        const total   = mailbox !== false ? mailbox.exists : 0
        if (total === 0) {
          await client.logout()
          return NextResponse.json({ messages: [] })
        }

        const start = Math.max(1, total - 39)
        const range = `${start}:${total}`

        for await (const msg of client.fetch(range, {
          envelope: true,
          flags:    true,
        })) {
          const from    = msg.envelope?.from?.[0]
          const to      = msg.envelope?.to?.[0]
          const rawFrom = from ? `${from.name || ''} <${from.address || ''}>` : ''
          const rawTo   = to   ? `${to.name   || ''} <${to.address   || ''}>` : ''
          const { name: fromName, email: fromEmail } = parseFrom(rawFrom)
          const { name: toName,   email: toEmail }   = parseFrom(rawTo)

          messages.push({
            id:        String(msg.uid),
            threadId:  String(msg.uid),
            subject:   msg.envelope?.subject || '(no subject)',
            from:      rawFrom,
            fromName:  fromName || fromEmail,
            fromEmail,
            to:        rawTo,
            toName:    toName || toEmail,
            toEmail,
            date:      msg.envelope?.date?.toISOString() || '',
            snippet:   '',
            read:      !(msg.flags?.has('\\Seen') ?? false),
            isSent:    box === 'Sent',
          })
        }
      } finally {
        lock.release()
      }

      await client.logout()

      // Return newest first
      return NextResponse.json({ messages: messages.reverse() })

    } catch (err) {
      await client.logout().catch(() => {})
      throw err
    }

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[API /mail/inbox]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
