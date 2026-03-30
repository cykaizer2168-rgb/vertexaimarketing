'use client'
// src/components/views/CalendarView.tsx
import { useState, useEffect, useCallback } from 'react'
import { CalendarDays, Video, Clock, Plus, RefreshCw, Users } from 'lucide-react'
import type { Lead } from '@/types'
import BookingModal from '@/components/calendar/BookingModal'

interface CalEvent {
  id:           string
  summary:      string
  start:        string
  end:          string
  attendees?:   { email?: string; name?: string; status?: string }[]
  meetLink?:    string
  htmlLink?:    string
  description?: string
  status?:      string
}

interface Props {
  leads: Lead[]
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit', hour12: true })
}

function formatDuration(start: string, end: string): string {
  const mins = Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000)
  if (mins < 60) return `${mins}m`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m === 0 ? `${h}h` : `${h}h ${m}m`
}

function getWeekDays(startDate: Date): Date[] {
  const monday = new Date(startDate)
  monday.setDate(startDate.getDate() - ((startDate.getDay() + 6) % 7))
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d
  })
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
}

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export default function CalendarView({ leads }: Props) {
  const [events,      setEvents]      = useState<CalEvent[]>([])
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState<string | null>(null)
  const [bookingLead, setBookingLead] = useState<Lead | null>(null)
  const [weekOffset,  setWeekOffset]  = useState(0)

  const fetchEvents = useCallback(async function fetchEvents() {
    setLoading(true)
    setError(null)
    try {
      const res  = await fetch('/api/calendar?days=30')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to fetch events')
      setEvents(data.events || [])
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load calendar')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchEvents() }, [fetchEvents])

  const today    = new Date()
  const weekBase = new Date(today)
  weekBase.setDate(today.getDate() + weekOffset * 7)
  const weekDays = getWeekDays(weekBase)

  const eventsForDay = (day: Date) =>
    events.filter(e => e.start && isSameDay(new Date(e.start), day))

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-blue-400" /> Calendar
          </div>
          <div className="text-[11px] text-slate-500">
            {weekDays[0].toLocaleDateString('en-PH', { month:'short', day:'numeric' })} –{' '}
            {weekDays[6].toLocaleDateString('en-PH', { month:'short', day:'numeric', year:'numeric' })}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setWeekOffset(w => w - 1)}
            className="px-3 py-1.5 text-xs text-slate-400 bg-[#141425] border border-white/[0.06] rounded-lg hover:text-slate-200 hover:bg-[#1a1a2e] transition-colors">
            ← Prev
          </button>
          <button onClick={() => setWeekOffset(0)}
            className="px-3 py-1.5 text-xs text-slate-400 bg-[#141425] border border-white/[0.06] rounded-lg hover:text-slate-200 hover:bg-[#1a1a2e] transition-colors">
            Today
          </button>
          <button onClick={() => setWeekOffset(w => w + 1)}
            className="px-3 py-1.5 text-xs text-slate-400 bg-[#141425] border border-white/[0.06] rounded-lg hover:text-slate-200 hover:bg-[#1a1a2e] transition-colors">
            Next →
          </button>
          <button onClick={fetchEvents}
            className={`w-8 h-8 flex items-center justify-center rounded-lg bg-[#141425] border border-white/[0.06] text-slate-500 hover:text-slate-300 transition-colors ${loading ? 'animate-spin' : ''}`}>
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => setBookingLead(leads[0] || null)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors">
            <Plus className="w-3 h-3" /> Book New Call
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Weekly Grid */}
      <div className="bg-[#0f0f1a] border border-white/[0.06] rounded-xl overflow-hidden">
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-white/[0.06]">
          {weekDays.map((day, i) => {
            const isToday = isSameDay(day, today)
            return (
              <div key={i} className={`px-3 py-2.5 text-center border-r border-white/[0.04] last:border-0 ${isToday ? 'bg-blue-500/10' : 'bg-[#141425]'}`}>
                <div className="text-[10px] text-slate-500 uppercase tracking-wider">{DAY_LABELS[i]}</div>
                <div className={`text-[15px] font-semibold font-mono mt-0.5 ${isToday ? 'text-blue-400' : 'text-slate-300'}`}>
                  {day.getDate()}
                </div>
              </div>
            )
          })}
        </div>

        {/* Event cells */}
        <div className="grid grid-cols-7 min-h-[360px]">
          {weekDays.map((day, i) => {
            const dayEvents = eventsForDay(day)
            const isToday   = isSameDay(day, today)
            return (
              <div key={i} className={`border-r border-white/[0.04] last:border-0 p-2 space-y-1.5 ${isToday ? 'bg-blue-500/[0.03]' : ''}`}>
                {dayEvents.map(ev => (
                  <div key={ev.id}
                    className="bg-blue-500/15 border border-blue-500/25 rounded-lg p-2 hover:bg-blue-500/20 transition-colors">
                    <div className="text-[11px] font-semibold text-blue-300 leading-tight truncate">{ev.summary}</div>
                    <div className="flex items-center gap-1 mt-1 text-[10px] text-blue-400/70 font-mono">
                      <Clock className="w-2.5 h-2.5" />
                      {formatTime(ev.start)} · {formatDuration(ev.start, ev.end)}
                    </div>
                    {ev.attendees && ev.attendees.length > 1 && (
                      <div className="flex items-center gap-1 mt-1 text-[10px] text-slate-500">
                        <Users className="w-2.5 h-2.5" />
                        {ev.attendees.length} attendees
                      </div>
                    )}
                    {ev.meetLink && (
                      <a href={ev.meetLink} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1 mt-1.5 text-[10px] text-emerald-400 hover:text-emerald-300 font-semibold transition-colors"
                        onClick={e => e.stopPropagation()}>
                        <Video className="w-2.5 h-2.5" /> Join Meet
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      </div>

      {/* Upcoming list */}
      {!loading && events.length > 0 && (
        <div>
          <div className="text-[11px] text-slate-500 uppercase tracking-wider font-medium mb-2">
            All Upcoming ({events.length})
          </div>
          <div className="space-y-2">
            {events.slice(0, 10).map(ev => (
              <div key={ev.id} className="bg-[#0f0f1a] border border-white/[0.06] rounded-xl px-4 py-3 flex items-center gap-4">
                <div className="text-center min-w-[48px]">
                  <div className="text-[10px] text-slate-500 uppercase">
                    {new Date(ev.start).toLocaleDateString('en-PH', { month:'short' })}
                  </div>
                  <div className="text-xl font-mono font-semibold text-slate-200">{new Date(ev.start).getDate()}</div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-semibold text-slate-200 truncate">{ev.summary}</div>
                  <div className="text-[11px] text-slate-500 font-mono">
                    {formatTime(ev.start)} · {formatDuration(ev.start, ev.end)}
                  </div>
                </div>
                {ev.meetLink && (
                  <a href={ev.meetLink} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-semibold rounded-lg hover:bg-emerald-500/20 transition-colors">
                    <Video className="w-3 h-3" /> Join Meet
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && events.length === 0 && !error && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <CalendarDays className="w-12 h-12 text-slate-700 mb-4" />
          <div className="text-slate-400 font-semibold mb-1">No upcoming bookings</div>
          <div className="text-slate-600 text-sm mb-4">Book a scoping call to see it here.</div>
          <button onClick={() => setBookingLead(leads[0] || null)}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors">
            <Plus className="w-3.5 h-3.5" /> Book New Call
          </button>
        </div>
      )}

      {bookingLead && (
        <BookingModal lead={bookingLead} onClose={() => { setBookingLead(null); fetchEvents() }} />
      )}
    </div>
  )
}
