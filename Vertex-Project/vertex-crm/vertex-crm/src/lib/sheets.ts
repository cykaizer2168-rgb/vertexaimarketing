import { getSheetsClient } from './google'
import type { Lead, SheetRow, AdMetric } from '@/types'
import { readSettings } from './settings'

const SHEET_ID   = process.env.GOOGLE_SHEET_ID!
const LEADS_TAB  = process.env.GOOGLE_SHEET_LEADS_TAB  || 'Leads'
const SCOPING_TAB = process.env.GOOGLE_SHEET_SCOPING_TAB || 'Scoping Calls'

// ─── Column order in your Google Sheet ───────────────────────────────────────
// Matches: row_number | name | email | phone | company | industry | pain_points
//        | ai_score | suggested_automation | estimated_roi | outreach_hook
//        | status | estimated_value | source | created_at | last_contacted
const COLS = [
  'row_number','name','email','phone','company','industry','pain_points',
  'ai_score','suggested_automation','estimated_roi','outreach_hook',
  'status','estimated_value','source','created_at','last_contacted',
]

function rowToLead(row: string[], index: number): Lead {
  const get = (col: string) => row[COLS.indexOf(col)] || ''
  const score = parseInt(get('ai_score')) || 0
  return {
    id:          String(index + 2),
    sheetRow:    index + 2,
    name:        get('name'),
    email:       get('email'),
    phone:       get('phone'),
    company:     get('company'),
    industry:    get('industry'),
    painPoints:  get('pain_points'),
    aiScore:     score,
    aiReadinessScore: score,
    suggestedAutomation: get('suggested_automation') || 'General AI Automation',
    automationType: score >= 85 ? 'blue' : score >= 70 ? 'green' : score >= 55 ? 'amber' : 'purple',
    estimatedRoi:    get('estimated_roi'),
    outreachHook:    get('outreach_hook'),
    estimatedValue:  parseInt(get('estimated_value').replace(/[^\d]/g, '')) || 0,
    status:      (get('status') as Lead['status']) || 'new',
    source:      (get('source') as Lead['source']) || 'manual',
    createdAt:   get('created_at') || new Date().toISOString(),
    lastContacted: get('last_contacted') || undefined,
  }
}

// ─── Read all leads ───────────────────────────────────────────────────────────
export async function getLeads(): Promise<Lead[]> {
  try {
    const sheets = await getSheetsClient()
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${LEADS_TAB}!A2:P`,
    })
    const rows = res.data.values || []
    return rows.map((r, i) => rowToLead(r, i))
  } catch (err) {
    console.error('[Sheets] getLeads error:', err)
    return []
  }
}

// ─── Update a lead's status ───────────────────────────────────────────────────
export async function updateLeadStatus(sheetRow: number, status: string): Promise<void> {
  const sheets = await getSheetsClient()
  const statusColIndex = COLS.indexOf('status')
  const colLetter = String.fromCharCode(65 + statusColIndex) // A=0, L=11 → 'L'
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: `${LEADS_TAB}!${colLetter}${sheetRow}`,
    valueInputOption: 'RAW',
    requestBody: { values: [[status]] },
  })
}

// ─── Update last contacted date ───────────────────────────────────────────────
export async function updateLastContacted(sheetRow: number): Promise<void> {
  const sheets = await getSheetsClient()
  const colLetter = String.fromCharCode(65 + COLS.indexOf('last_contacted'))
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: `${LEADS_TAB}!${colLetter}${sheetRow}`,
    valueInputOption: 'RAW',
    requestBody: { values: [[new Date().toISOString()]] },
  })
}

// ─── Append a scoping call record ─────────────────────────────────────────────
export async function appendScopingCall(data: {
  leadName: string
  leadEmail: string
  company: string
  scheduledAt: string
  durationMinutes: number
  leadId?: string
  notes?: string
  googleEventId?: string
  meetLink?: string
}): Promise<void> {
  const sheets = await getSheetsClient()
  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: `${SCOPING_TAB}!A:J`,
    valueInputOption: 'RAW',
    requestBody: {
      values: [[
        data.leadName,
        data.leadEmail,
        data.company,
        data.scheduledAt,
        data.durationMinutes,
        data.notes || '',
        data.googleEventId || '',
        data.meetLink || '',
        data.leadId || '',
        new Date().toISOString(),
      ]],
    },
  })
}

// ─── Append a new lead ────────────────────────────────────────────────────────
export async function appendLead(data: {
  name:       string
  email:      string
  phone?:     string
  company:    string
  industry:   string
  painPoints?: string
}): Promise<number> {
  const sheets = await getSheetsClient()
  const now = new Date().toISOString()
  const res = await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range:         `${LEADS_TAB}!A:P`,
    valueInputOption: 'RAW',
    insertDataOption: 'INSERT_ROWS',
    requestBody: {
      values: [COLS.map(col => {
        switch (col) {
          case 'name':            return data.name
          case 'email':           return data.email
          case 'phone':           return data.phone      ?? ''
          case 'company':         return data.company
          case 'industry':        return data.industry
          case 'pain_points':     return data.painPoints ?? ''
          case 'ai_score':        return '0'
          case 'suggested_automation': return ''
          case 'estimated_roi':   return ''
          case 'outreach_hook':   return ''
          case 'status':          return 'new'
          case 'estimated_value': return '0'
          case 'source':          return 'manual'
          case 'created_at':      return now
          case 'last_contacted':  return ''
          default:                return ''
        }
      })],
    },
  })
  // Parse row number from updatedRange e.g. "Leads!A25:P25"
  const updatedRange = res.data.updates?.updatedRange || ''
  const match = updatedRange.match(/:?[A-Z]+(\d+)$/)
  if (!match) throw new Error(`appendLead: could not parse sheetRow from updatedRange "${updatedRange}"`)
  return parseInt(match[1])
}

// ─── Read ad performance metrics ─────────────────────────────────────────────
// Column order in "Ad Metrics" tab (written by n8n):
// A: date | B: campaign_id | C: campaign_name | D: ad_set_id | E: ad_set_name |
// F: spend | G: leads | H: impressions | I: clicks | J: ctr | K: cpl | L: roas | M: status
export async function getAdMetrics(): Promise<AdMetric[]> {
  try {
    const settings = await readSettings()
    const sheets   = await getSheetsClient()
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range:         `${settings.adMetricsTab}!A2:M`,
    })
    const rows = res.data.values || []
    // Deduplicate by adSetId — last occurrence wins (n8n appends newest rows at bottom)
    const seen = new Map<string, AdMetric>()
    for (const row of rows) {
      const adSetId = row[3] || ''
      if (!adSetId) continue
      seen.set(adSetId, {
        date:         row[0]  || '',
        campaignId:   row[1]  || '',
        campaignName: row[2]  || '',
        adSetId:      row[3]  || '',
        adSetName:    row[4]  || '',
        spend:        parseFloat(row[5])  || 0,
        leads:        parseInt(row[6])    || 0,
        impressions:  parseInt(row[7])    || 0,
        clicks:       parseInt(row[8])    || 0,
        ctr:          parseFloat(row[9])  || 0,
        cpl:          parseFloat(row[10]) || 0,
        roas:         parseFloat(row[11]) || 0,
        status:       (row[12] as AdMetric['status']) || 'active',
      })
    }
    return Array.from(seen.values())
  } catch (err) {
    console.error('[Sheets] getAdMetrics error:', err)
    return []
  }
}
