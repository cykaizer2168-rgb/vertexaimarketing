import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { writeFile } from 'fs/promises'
import { readSettings, AppSettings, SETTINGS_PATH } from '@/lib/settings'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return NextResponse.json(await readSettings())
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const body = await req.json() as Partial<AppSettings>
    const current = await readSettings()
    const updated: AppSettings = {
      sheetId:     body.sheetId     ?? current.sheetId,
      leadsTab:    body.leadsTab    ?? current.leadsTab,
      scopingTab:  body.scopingTab  ?? current.scopingTab,
      chatLogsTab: body.chatLogsTab ?? current.chatLogsTab,
      calendlyUrl: body.calendlyUrl ?? current.calendlyUrl,
      adminEmail:  body.adminEmail  ?? current.adminEmail,
      webhookUrl:  body.webhookUrl  ?? current.webhookUrl ?? '',
    }
    await writeFile(SETTINGS_PATH, JSON.stringify(updated, null, 2), 'utf-8')
    return NextResponse.json({ ok: true, settings: updated })
  } catch (err: unknown) {
    console.error('[settings POST] Failed to save settings.json:', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 })
  }
}
