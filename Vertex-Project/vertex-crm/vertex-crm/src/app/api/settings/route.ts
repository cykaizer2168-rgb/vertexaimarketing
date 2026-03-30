import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { readFile, writeFile } from 'fs/promises'
import { existsSync } from 'fs'
import { join } from 'path'

const SETTINGS_PATH = join(process.cwd(), 'settings.json')

export interface AppSettings {
  sheetId:     string
  leadsTab:    string
  scopingTab:  string
  chatLogsTab: string
  calendlyUrl: string
  adminEmail:  string
}

async function readSettings(): Promise<AppSettings> {
  if (existsSync(SETTINGS_PATH)) {
    try {
      const raw = await readFile(SETTINGS_PATH, 'utf-8')
      return JSON.parse(raw) as AppSettings
    } catch (err) {
      console.error('[settings] Failed to parse settings.json:', err)
    }
  }
  return {
    sheetId:     process.env.GOOGLE_SHEET_ID              || '',
    leadsTab:    process.env.GOOGLE_SHEET_LEADS_TAB       || 'Leads',
    scopingTab:  process.env.GOOGLE_SHEET_SCOPING_TAB     || 'Scoping Calls',
    chatLogsTab: process.env.GOOGLE_SHEET_CHAT_LOGS_TAB   || 'Chat Logs',
    calendlyUrl: process.env.NEXT_PUBLIC_CALENDLY_URL     || '',
    adminEmail:  process.env.NEXT_PUBLIC_ADMIN_EMAIL      || '',
  }
}

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
    }
    await writeFile(SETTINGS_PATH, JSON.stringify(updated, null, 2), 'utf-8')
    return NextResponse.json({ ok: true, settings: updated })
  } catch (err: unknown) {
    console.error('[settings POST] Failed to save settings.json:', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 })
  }
}
