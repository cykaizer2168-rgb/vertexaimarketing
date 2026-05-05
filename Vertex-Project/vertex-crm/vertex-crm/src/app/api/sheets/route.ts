import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getSheetsServiceClient } from '@/lib/google'
import type { LandingLead, ChatLog } from '@/types'

const SHEET_ID       = process.env.GOOGLE_SHEET_ID!
const LEADS_TAB      = process.env.GOOGLE_SHEET_LANDING_LEADS_TAB || 'Leads'
const CHAT_LOGS_TAB  = process.env.GOOGLE_SHEET_CHAT_LOGS_TAB     || 'Chat Logs'

// ─── GET /api/sheets?tab=leads|chatLogs ───────────────────────────────────────
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const tab = req.nextUrl.searchParams.get('tab') ?? 'leads'

  try {
    const sheets = await getSheetsServiceClient()

    if (tab === 'chatLogs') {
      const res = await sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_ID,
        range: `${CHAT_LOGS_TAB}!A2:F`,
      })
      const rows = res.data.values ?? []
      const data: ChatLog[] = rows
        .map(r => ({
          timestamp:   r[0] ?? '',
          source:      r[1] ?? '',
          sessionId:   r[2] ?? '',
          userMessage: r[3] ?? '',
          botReply:    r[4] ?? '',
          summary:     r[5] ?? '',
        }))
        .reverse()
      return NextResponse.json({ data })
    }

    // default: leads
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${LEADS_TAB}!A2:G`,
    })
    const rows = res.data.values ?? []
    const data: LandingLead[] = rows
      .map(r => ({
        timestamp:    r[0] ?? '',
        fullName:     r[1] ?? '',
        businessName: r[2] ?? '',
        contact:      r[3] ?? '',
        email:        r[4] ?? '',
        interest:     r[5] ?? '',
        message:      r[6] ?? '',
      }))
      .reverse()
    return NextResponse.json({ data })

  } catch (err) {
    console.error('[/api/sheets] error:', err)
    return NextResponse.json({ error: 'Failed to fetch sheet data' }, { status: 500 })
  }
}
