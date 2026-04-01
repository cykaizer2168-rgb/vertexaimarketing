// ─── Lead ───────────────────────────────────────────────────────────────────
export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'hot' | 'nurture' | 'closed'

export interface Lead {
  id: string
  name: string
  email: string
  phone?: string
  company: string
  industry: string
  painPoints?: string
  aiScore: number
  aiReadinessScore: number
  suggestedAutomation: string
  automationType: 'blue' | 'purple' | 'green' | 'amber'
  estimatedRoi?: string
  outreachHook?: string
  estimatedValue: number
  status: LeadStatus
  source: 'google_sheets' | 'manual' | 'n8n_webhook' | 'landing_page'
  createdAt: string
  lastContacted?: string
  // Google Sheets row reference for updates
  sheetRow: number
}

// ─── Email ───────────────────────────────────────────────────────────────────
export interface EmailPayload {
  to: string
  toName: string
  subject: string
  body: string
  leadId?: string
}

export interface EmailThread {
  id: string
  threadId: string
  subject: string
  from: string
  snippet: string
  date: string
  read: boolean
}

// ─── Calendar ────────────────────────────────────────────────────────────────
export interface CalendarEvent {
  id?: string
  summary: string
  description?: string
  startDateTime: string
  endDateTime: string
  attendees: { email: string; name?: string }[]
  location?: string
  meetLink?: string
  leadId?: string
}

export interface ScopingCall {
  leadId: string
  leadName: string
  leadEmail: string
  company: string
  scheduledAt: string
  durationMinutes: number
  notes?: string
  googleEventId?: string
  meetLink?: string
}

// ─── AI Intelligence ─────────────────────────────────────────────────────────
export interface AILog {
  id: string
  type: 'enriched' | 'scored' | 'alert' | 'workflow' | 'email_sent' | 'meeting_booked'
  message: string
  leadId?: string
  timestamp: string
}

export interface WorkflowStatus {
  id: string
  name: string
  status: 'running' | 'idle' | 'error'
  lastRun: string
  runsToday: number
}

// ─── Stats ────────────────────────────────────────────────────────────────────
export interface DashboardStats {
  totalLeads: number
  totalLeadsGrowth: number
  avgAiScore: number
  pipelineValue: number
  pipelineGrowth: number
  activeAutomations: number
  emailsSentToday: number
  meetingsScheduled: number
}

// ─── Google Sheets Row ────────────────────────────────────────────────────────
export interface SheetRow {
  row_number: number
  name: string
  email: string
  phone?: string
  company: string
  industry: string
  pain_points?: string
  ai_score?: number
  suggested_automation?: string
  estimated_roi?: string
  outreach_hook?: string
  status?: string
  estimated_value?: string
  source?: string
  created_at?: string
  last_contacted?: string
}

// ─── Ad Performance ───────────────────────────────────────────────────────────
export interface AdMetric {
  date:         string
  campaignId:   string
  campaignName: string
  adSetId:      string
  adSetName:    string
  spend:        number
  leads:        number
  impressions:  number
  clicks:       number
  ctr:          number   // percentage, e.g. 2.4 = 2.4%
  cpl:          number
  roas:         number
  status:       'active' | 'paused' | 'paused_auto'
}
