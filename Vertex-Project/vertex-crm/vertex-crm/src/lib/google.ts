import { google } from 'googleapis'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

/**
 * Returns an authenticated OAuth2 client using the current session's tokens.
 * Call this in any server-side route that needs Google APIs.
 */
export async function getGoogleClient() {
  const session = await getServerSession(authOptions)
  if (!session?.accessToken) {
    throw new Error('Not authenticated — no access token in session')
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
  )
  oauth2Client.setCredentials({
    access_token:  session.accessToken,
    refresh_token: session.refreshToken,
  })
  return oauth2Client
}

// ─── Gmail ────────────────────────────────────────────────────────────────────
export async function getGmailClient() {
  const auth = await getGoogleClient()
  return google.gmail({ version: 'v1', auth })
}

// ─── Google Calendar ──────────────────────────────────────────────────────────
export async function getCalendarClient() {
  const auth = await getGoogleClient()
  return google.calendar({ version: 'v3', auth })
}

// ─── Google Sheets ────────────────────────────────────────────────────────────
export async function getSheetsClient() {
  const auth = await getGoogleClient()
  return google.sheets({ version: 'v4', auth })
}

/** Encode a plain string to base64url (for Gmail raw message body) */
export function encodeEmail(raw: string): string {
  return Buffer.from(raw)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

/** Build a MIME email string */
export function buildMimeEmail({
  to,
  toName,
  from,
  fromName,
  subject,
  body,
  replyTo,
}: {
  to: string
  toName?: string
  from: string
  fromName?: string
  subject: string
  body: string
  replyTo?: string
}): string {
  const toHeader  = toName   ? `"${toName}" <${to}>`   : to
  const fromHeader = fromName ? `"${fromName}" <${from}>` : from
  const lines = [
    `From: ${fromHeader}`,
    `To: ${toHeader}`,
    `Subject: ${subject}`,
    `MIME-Version: 1.0`,
    `Content-Type: text/html; charset=utf-8`,
    replyTo ? `Reply-To: ${replyTo}` : '',
    '',
    body,
  ].filter(l => l !== undefined)
  return lines.join('\r\n')
}
