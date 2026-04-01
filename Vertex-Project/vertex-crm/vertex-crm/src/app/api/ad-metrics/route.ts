import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { writeFile } from 'fs/promises'
import { getAdMetrics } from '@/lib/sheets'
import { readSettings, SETTINGS_PATH } from '@/lib/settings'

/** GET /api/ad-metrics — fetch all ad metrics + current thresholds */
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const [metrics, settings] = await Promise.all([getAdMetrics(), readSettings()])
    return NextResponse.json({ metrics, thresholds: settings.adThresholds })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[API /ad-metrics GET]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

/** PATCH /api/ad-metrics — save per-campaign CPL threshold */
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { campaignId, threshold } = await req.json()
    if (!campaignId || typeof threshold !== 'number') {
      return NextResponse.json({ error: 'Missing campaignId or threshold' }, { status: 400 })
    }

    const current = await readSettings()
    const updated = {
      ...current,
      adThresholds: { ...current.adThresholds, [campaignId]: threshold },
    }
    await writeFile(SETTINGS_PATH, JSON.stringify(updated, null, 2), 'utf-8')
    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[API /ad-metrics PATCH]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
