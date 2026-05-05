import { NextRequest, NextResponse } from 'next/server'
import { getSheetsClient } from '@/lib/google'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const SHEET_ID  = process.env.GOOGLE_SHEET_ID!
const LEADS_TAB = process.env.GOOGLE_SHEET_LEADS_TAB || 'Leads'

const COLS = [
  'row_number','name','email','phone','company','industry','pain_points',
  'ai_score','suggested_automation','estimated_roi','outreach_hook',
  'status','estimated_value','source','created_at','last_contacted',
]

/**
 * POST /api/leads/import
 * Body: { leads: Array<{ name, email, phone?, company, industry?, painPoints? }> }
 * Bulk-appends all leads to the Leads sheet in one API call.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { leads } = await req.json()
    if (!Array.isArray(leads) || leads.length === 0) {
      return NextResponse.json({ error: 'leads must be a non-empty array' }, { status: 400 })
    }

    const sheets = await getSheetsClient()
    const now    = new Date().toISOString()

    const rows = leads.map((lead: {
      name: string; email: string; phone?: string
      company: string; industry?: string; painPoints?: string
    }) =>
      COLS.map(col => {
        switch (col) {
          case 'name':        return lead.name        || ''
          case 'email':       return lead.email       || ''
          case 'phone':       return lead.phone       || ''
          case 'company':     return lead.company     || ''
          case 'industry':    return lead.industry    || ''
          case 'pain_points': return lead.painPoints  || ''
          case 'ai_score':    return '0'
          case 'status':      return 'new'
          case 'estimated_value': return '0'
          case 'source':      return 'csv_import'
          case 'created_at':  return now
          default:            return ''
        }
      })
    )

    await sheets.spreadsheets.values.append({
      spreadsheetId:    SHEET_ID,
      range:            `${LEADS_TAB}!A:P`,
      valueInputOption: 'RAW',
      insertDataOption: 'INSERT_ROWS',
      requestBody:      { values: rows },
    })

    return NextResponse.json({ success: true, imported: rows.length })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[API /leads/import]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
