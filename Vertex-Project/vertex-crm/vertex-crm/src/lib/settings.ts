// src/lib/settings.ts
import { readFile } from 'fs/promises'
import { existsSync } from 'fs'
import { join } from 'path'

export const SETTINGS_PATH = join(process.cwd(), 'settings.json')

export interface AppSettings {
  sheetId:      string
  leadsTab:     string
  scopingTab:   string
  chatLogsTab:  string
  calendlyUrl:  string
  adminEmail:   string
  webhookUrl:   string
  adMetricsTab: string
  adThresholds: Record<string, number>
}

export async function readSettings(): Promise<AppSettings> {
  if (existsSync(SETTINGS_PATH)) {
    try {
      const raw    = await readFile(SETTINGS_PATH, 'utf-8')
      const parsed = JSON.parse(raw)
      return {
        sheetId:      parsed.sheetId      ?? process.env.GOOGLE_SHEET_ID              ?? '',
        leadsTab:     parsed.leadsTab     ?? process.env.GOOGLE_SHEET_LEADS_TAB       ?? 'Leads',
        scopingTab:   parsed.scopingTab   ?? process.env.GOOGLE_SHEET_SCOPING_TAB     ?? 'Scoping Calls',
        chatLogsTab:  parsed.chatLogsTab  ?? process.env.GOOGLE_SHEET_CHAT_LOGS_TAB   ?? 'Chat Logs',
        calendlyUrl:  parsed.calendlyUrl  ?? process.env.NEXT_PUBLIC_CALENDLY_URL     ?? '',
        adminEmail:   parsed.adminEmail   ?? process.env.NEXT_PUBLIC_ADMIN_EMAIL      ?? '',
        webhookUrl:   parsed.webhookUrl   ?? process.env.N8N_WEBHOOK_URL              ?? '',
        adMetricsTab: parsed.adMetricsTab ?? 'Ad Metrics',
        adThresholds: parsed.adThresholds ?? {},
      }
    } catch (err) {
      console.error('[settings] Failed to parse settings.json:', err)
    }
  }
  return {
    sheetId:      process.env.GOOGLE_SHEET_ID              || '',
    leadsTab:     process.env.GOOGLE_SHEET_LEADS_TAB       || 'Leads',
    scopingTab:   process.env.GOOGLE_SHEET_SCOPING_TAB     || 'Scoping Calls',
    chatLogsTab:  process.env.GOOGLE_SHEET_CHAT_LOGS_TAB   || 'Chat Logs',
    calendlyUrl:  process.env.NEXT_PUBLIC_CALENDLY_URL     || '',
    adminEmail:   process.env.NEXT_PUBLIC_ADMIN_EMAIL       || '',
    webhookUrl:   process.env.N8N_WEBHOOK_URL               || '',
    adMetricsTab: 'Ad Metrics',
    adThresholds: {},
  }
}
