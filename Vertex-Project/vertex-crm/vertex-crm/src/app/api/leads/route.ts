import { NextRequest, NextResponse } from 'next/server'
import { getLeads, updateLeadStatus } from '@/lib/sheets'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { triggerWebhook } from '@/lib/webhook'

/** GET /api/leads — fetch all leads from Google Sheets */
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const leads = await getLeads()
    if (leads.length > 0) {
      await triggerWebhook('leads_refreshed', { count: leads.length })
    }
    return NextResponse.json({ leads })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

/** PATCH /api/leads — update lead status */
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { sheetRow, status } = await req.json()
    if (!sheetRow || !status) {
      return NextResponse.json({ error: 'Missing sheetRow or status' }, { status: 400 })
    }

    await updateLeadStatus(sheetRow, status)
    await triggerWebhook('status_changed', { sheetRow, status })
    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
