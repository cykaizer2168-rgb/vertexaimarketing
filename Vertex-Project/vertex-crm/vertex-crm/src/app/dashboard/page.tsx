'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession, signIn, signOut } from 'next-auth/react'
import {
  LayoutDashboard, Users, Cpu, Activity, Settings,
  Bell, RefreshCw, LogOut, LogIn, CalendarDays, Layers, Search,
} from 'lucide-react'
import type { Lead, AILog, LeadStatus } from '@/types'
import EmailModal         from '@/components/email/EmailModal'
import BookingModal       from '@/components/calendar/BookingModal'
import AddLeadModal, { type AddLeadData } from '@/components/views/AddLeadModal'
import AISidePanel        from '@/components/views/AISidePanel'
import DashboardView      from '@/components/views/DashboardView'
import LeadsView          from '@/components/views/LeadsView'
import AIInsightsView     from '@/components/views/AIInsightsView'
import AutomationLogsView from '@/components/views/AutomationLogsView'
import CalendarView       from '@/components/views/CalendarView'
import SettingsView       from '@/components/views/SettingsView'
import toast, { Toaster } from 'react-hot-toast'

// ─── Mock fallback data ───────────────────────────────────────────────────────
const MOCK_LEADS: Lead[] = [
  { id:'1', sheetRow:2, name:'Maria Santos',    email:'maria@techcorp.ph',  phone:'+63 917 123 4567', company:'TechCorp PH',    industry:'Software',   aiScore:95, aiReadinessScore:95, suggestedAutomation:'NetSuite SuiteScript Automation', automationType:'blue',   estimatedValue:85000,  status:'hot',      source:'landing_page',  createdAt:'2026-03-28', outreachHook:"Your manual ERP reconciliation could be eliminated entirely — here's how we did it for 3 SaaS firms in 60 days." },
  { id:'2', sheetRow:3, name:'Ramon dela Cruz', email:'ramon@medisync.ph',  phone:'+63 918 234 5678', company:'MediSync Inc.',  industry:'Healthcare', aiScore:91, aiReadinessScore:91, suggestedAutomation:'AI Patient Scheduling Bot',        automationType:'green',  estimatedValue:120000, status:'qualified', source:'n8n_webhook',   createdAt:'2026-03-27', outreachHook:"Clinics using AI scheduling see 40% fewer no-shows — I'd love to show you the exact workflow." },
  { id:'3', sheetRow:4, name:'Carla Reyes',     email:'carla@logitrack.ph', phone:'+63 919 345 6789', company:'LogiTrack PH',  industry:'Logistics',  aiScore:88, aiReadinessScore:88, suggestedAutomation:'Route Optimization AI',            automationType:'purple', estimatedValue:95000,  status:'hot',      source:'google_sheets', createdAt:'2026-03-26', outreachHook:'Your dispatch team spends 3+ hours daily on routes that AI solves in seconds.' },
  { id:'4', sheetRow:5, name:'Jose Mendoza',    email:'jose@retailpro.ph',  phone:'+63 920 456 7890', company:'RetailPro Corp', industry:'Retail',     aiScore:82, aiReadinessScore:82, suggestedAutomation:'AI Inventory Predictor',           automationType:'amber',  estimatedValue:60000,  status:'contacted', source:'landing_page',  createdAt:'2026-03-25', lastContacted:'2026-03-29' },
  { id:'5', sheetRow:6, name:'Ana Villanueva',  email:'ana@edulearn.ph',    phone:'+63 921 567 8901', company:'EduLearn PH',   industry:'Education',  aiScore:77, aiReadinessScore:77, suggestedAutomation:'AI Enrollment Chatbot',            automationType:'blue',   estimatedValue:45000,  status:'new',      source:'n8n_webhook',   createdAt:'2026-03-24', outreachHook:'Schools using AI intake bots process 5x more enrollment inquiries without adding staff.' },
  { id:'6', sheetRow:7, name:'Mark Bautista',   email:'mark@finserve.ph',   phone:'+63 922 678 9012', company:'FinServe MNL',  industry:'Finance',    aiScore:71, aiReadinessScore:71, suggestedAutomation:'Compliance Report AI',             automationType:'green',  estimatedValue:110000, status:'nurture',   source:'manual',        createdAt:'2026-03-22' },
  { id:'7', sheetRow:8, name:'Liza Guzman',     email:'liza@foodchain.ph',  phone:'+63 923 789 0123', company:'FoodChain PH',  industry:'F&B',        aiScore:65, aiReadinessScore:65, suggestedAutomation:'Customer Support Bot',             automationType:'purple', estimatedValue:35000,  status:'new',      source:'landing_page',  createdAt:'2026-03-20' },
]

const MOCK_LOGS: AILog[] = [
  { id:'1', type:'enriched',       message:'TechCorp PH — NetSuite ERP usage detected. Lead Score → 95',              leadId:'1', timestamp:'2m ago'  },
  { id:'2', type:'scored',         message:'MediSync Inc. — Healthcare AI readiness confirmed. Est. ROI: ₱2.1M/yr',  leadId:'2', timestamp:'8m ago'  },
  { id:'3', type:'alert',          message:'LogiTrack PH — High-intent signal: visited pricing page 3×',             leadId:'3', timestamp:'15m ago' },
  { id:'4', type:'workflow',       message:'n8n "Lead Enrichment v2" — 47 runs today, 0 errors. Avg 1.4s',           timestamp:'22m ago' },
  { id:'5', type:'email_sent',     message:'Follow-up email sent to Jose Mendoza · RetailPro Corp',                  leadId:'4', timestamp:'34m ago' },
  { id:'6', type:'meeting_booked', message:'Scoping Call booked: EduLearn PH — April 2, 10:00 AM PHT',              leadId:'5', timestamp:'41m ago' },
]

// Pages that use full width (no AI side panel)
const FULL_WIDTH_PAGES = new Set(['Calendar', 'Settings'])

// Pages that show the search bar
const SEARCH_PAGES = new Set(['Dashboard', 'Leads (Active)'])

type PageName = 'Dashboard' | 'Leads (Active)' | 'AI Insights' | 'Calendar' | 'Automation Logs' | 'Settings'

function NavBtn({ label, icon: Icon, badge, badgeAmber, activePage, onNavigate }: {
  label: PageName; icon: React.ElementType; badge?: number; badgeAmber?: boolean
  activePage: PageName; onNavigate: (p: PageName) => void
}) {
  const active = activePage === label
  return (
    <button
      onClick={() => onNavigate(label)}
      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium mb-0.5 transition-all text-left ${
        active
          ? 'bg-blue-500/15 text-blue-400 border border-blue-500/20'
          : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
      }`}>
      <Icon className="w-4 h-4 flex-shrink-0 opacity-80" />
      <span className="flex-1">{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-semibold text-white ${badgeAmber ? 'bg-amber-500' : 'bg-blue-500'}`}>
          {badge}
        </span>
      )}
    </button>
  )
}

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const [leads,       setLeads]       = useState<Lead[]>(MOCK_LEADS)
  const [logs,        setLogs]        = useState<AILog[]>(MOCK_LOGS)
  const [loading,     setLoading]     = useState(false)
  const [emailLead,   setEmailLead]   = useState<Lead | null>(null)
  const [bookingLead, setBookingLead] = useState<Lead | null>(null)
  const [showAddLead, setShowAddLead] = useState(false)
  const [search,      setSearch]      = useState('')
  const [activePage,  setActivePage]  = useState<PageName>('Dashboard')

  const fetchLeads = useCallback(async () => {
    if (!session) return
    setLoading(true)
    try {
      const res = await fetch('/api/leads')
      if (res.ok) {
        const data = await res.json()
        if (data.leads?.length) setLeads(data.leads)
      }
    } catch { /* keep mock data */ }
    finally { setLoading(false) }
  }, [session])

  useEffect(() => { fetchLeads() }, [fetchLeads])

  const authenticated = status === 'authenticated'
  const showSidePanel = !FULL_WIDTH_PAGES.has(activePage)

  async function handleStatusChange(lead: Lead, status: LeadStatus) {
    let snapshot: Lead[] | null = null
    setLeads(prev => {
      snapshot = prev
      return prev.map(l => l.id === lead.id ? { ...l, status } : l)
    })
    try {
      const res = await fetch('/api/leads', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ sheetRow: lead.sheetRow, status }),
      })
      if (!res.ok) throw new Error('Update failed')
      toast.success('Status updated')
    } catch {
      if (snapshot !== null) setLeads(snapshot)
      toast.error('Failed to update status')
    }
  }

  async function handleAddLead(data: AddLeadData) {
    const tempId = `temp-${Date.now()}`
    const optimistic: Lead = {
      id:                  tempId,
      sheetRow:            0,
      name:                data.name,
      email:               data.email,
      phone:               data.phone,
      company:             data.company,
      industry:            data.industry,
      aiScore:             0,
      aiReadinessScore:    0,
      suggestedAutomation: '',
      automationType:      'blue',
      estimatedValue:      0,
      status:              'new',
      source:              'manual',
      createdAt:           new Date().toISOString().split('T')[0],
    }

    const snapshot = leads
    setLeads(prev => [optimistic, ...prev])

    try {
      const res = await fetch('/api/leads', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(data),
      })
      if (!res.ok) throw new Error('POST failed')
      const json = await res.json() as { success: boolean; sheetRow: number }
      setLeads(prev => prev.map(l => l.id === tempId ? { ...l, sheetRow: json.sheetRow } : l))
      toast.success('Lead added')
    } catch {
      setLeads(snapshot)
      toast.error('Failed to add lead')
      throw new Error('Failed to add lead')
    }
  }

  // Shared props passed to views that show leads
  const sharedProps = {
    leads,
    search,
    authenticated,
    onEmailLead:    setEmailLead,
    onBookingLead:  setBookingLead,
    onSignIn:       () => signIn('google'),
    onStatusChange: authenticated ? handleStatusChange : undefined,
    onAddLead:      () => setShowAddLead(true),
  }

  function renderContent() {
    switch (activePage) {
      case 'Dashboard':        return <DashboardView      {...sharedProps} />
      case 'Leads (Active)':   return <LeadsView          {...sharedProps} />
      case 'AI Insights':      return <AIInsightsView     leads={leads} logs={logs} />
      case 'Automation Logs':  return <AutomationLogsView logs={logs} />
      case 'Calendar':         return <CalendarView        leads={leads} />
      case 'Settings':         return (
        <SettingsView
          userEmail={session?.user?.email ?? undefined}
          userName={session?.user?.name   ?? undefined}
          userImage={session?.user?.image ?? undefined}
        />
      )
      default: return <DashboardView {...sharedProps} />
    }
  }

  // Nav computed at render time so badges are live
  const navMain: { label: PageName; icon: React.ElementType; badge?: number; badgeAmber?: boolean }[] = [
    { label: 'Dashboard',      icon: LayoutDashboard },
    { label: 'Leads (Active)', icon: Users,       badge: leads.filter(l => l.status !== 'closed').length },
    { label: 'AI Insights',    icon: Cpu,          badge: logs.filter(l => l.type === 'alert').length, badgeAmber: true },
    { label: 'Calendar',       icon: CalendarDays },
  ]
  const navAuto: { label: PageName; icon: React.ElementType }[] = [
    { label: 'Automation Logs', icon: Activity },
    { label: 'Settings',        icon: Settings },
  ]

  return (
    <div className="flex h-screen bg-[#09090f] text-slate-200 overflow-hidden font-sans">
      <Toaster position="top-right" toastOptions={{
        style:   { background: '#0f0f1a', border: '1px solid rgba(148,163,184,0.12)', color: '#e2e8f0', fontSize: '13px' },
        success: { iconTheme: { primary: '#10b981', secondary: '#09090f' } },
        error:   { iconTheme: { primary: '#ef4444', secondary: '#09090f' } },
      }} />

      {/* ── Sidebar ── */}
      <aside className="w-[220px] min-w-[220px] bg-[#0f0f1a] border-r border-white/[0.06] flex flex-col">
        {/* Logo */}
        <div className="px-5 py-4 border-b border-white/[0.06] flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center flex-shrink-0">
            <Layers className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="text-[13px] font-semibold text-slate-200 leading-tight">Vertex AI</div>
            <div className="text-[10px] text-slate-500 uppercase tracking-widest">Marketing CRM</div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-2 pt-3 overflow-y-auto">
          <div className="text-[10px] text-slate-600 uppercase tracking-widest px-3 mb-1.5 font-medium">Main</div>
          {navMain.map(item => (
            <NavBtn key={item.label} {...item} activePage={activePage} onNavigate={setActivePage} />
          ))}
          <div className="text-[10px] text-slate-600 uppercase tracking-widest px-3 mb-1.5 font-medium mt-4">Automation</div>
          {navAuto.map(item => (
            <NavBtn key={item.label} {...item} activePage={activePage} onNavigate={setActivePage} />
          ))}
        </nav>

        {/* User */}
        <div className="p-3 border-t border-white/[0.06]">
          {authenticated ? (
            <div className="flex items-center gap-2.5 p-2 rounded-lg bg-[#141425]">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0">
                {session.user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'AF'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[12px] font-semibold text-slate-200 truncate">{session.user?.name || 'Angelo Franco'}</div>
                <div className="text-[10px] text-slate-500 truncate">Admin · Consultant</div>
              </div>
              <button onClick={() => signOut()} title="Sign out" className="text-slate-600 hover:text-red-400 transition-colors">
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button onClick={() => signIn('google')}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white text-xs font-semibold rounded-lg transition-colors">
              <LogIn className="w-3.5 h-3.5" /> Connect Google
            </button>
          )}
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Header */}
        <header className="bg-[#0f0f1a] border-b border-white/[0.06] px-6 py-3 flex items-center gap-4 flex-shrink-0">
          <div className="flex-1">
            <div className="text-[15px] font-semibold text-slate-200">{activePage}</div>
            <div className="text-[11px] text-slate-500">Vertex AI Marketing CRM</div>
          </div>
          {SEARCH_PAGES.has(activePage) && (
            <div className="flex items-center gap-2 bg-[#141425] border border-white/[0.06] rounded-lg px-3 py-2 min-w-[220px]">
              <Search className="w-3.5 h-3.5 text-slate-500" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search leads…"
                className="bg-transparent outline-none text-[13px] text-slate-200 placeholder-slate-600 w-full"
              />
            </div>
          )}
          <button onClick={fetchLeads}
            className={`w-8 h-8 flex items-center justify-center rounded-lg bg-[#141425] border border-white/[0.06] text-slate-500 hover:text-slate-300 transition-colors ${loading ? 'animate-spin' : ''}`}>
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <div className="relative">
            <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#141425] border border-white/[0.06] text-slate-500 hover:text-slate-300 transition-colors">
              <Bell className="w-3.5 h-3.5" />
            </button>
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-blue-500 rounded-full" />
          </div>
          {!authenticated && (
            <button onClick={() => signIn('google')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-xs font-semibold rounded-lg transition-colors">
              <LogIn className="w-3 h-3" /> Sign in
            </button>
          )}
        </header>

        {/* Content + optional side panel */}
        <div className="flex-1 flex overflow-hidden min-h-0">
          <div className="flex-1 overflow-y-auto p-5 min-w-0">
            {renderContent()}
          </div>
          {showSidePanel && <AISidePanel logs={logs} leads={leads} />}
        </div>
      </div>

      {/* ── Modals ── */}
      {emailLead   && <EmailModal   lead={emailLead}   onClose={() => setEmailLead(null)} />}
      {bookingLead && <BookingModal lead={bookingLead} onClose={() => setBookingLead(null)} />}
      {showAddLead && <AddLeadModal onClose={() => setShowAddLead(false)} onAdd={handleAddLead} />}
    </div>
  )
}
