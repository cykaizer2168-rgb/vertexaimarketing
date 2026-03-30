'use client'

import { useState } from 'react'
import { X, Calendar, Clock, Users, Video, Loader2, CheckCircle } from 'lucide-react'
import type { Lead } from '@/types'
import toast from 'react-hot-toast'
import { format, addDays, setHours, setMinutes } from 'date-fns'

interface BookingModalProps {
  lead: Lead
  onClose: () => void
}

const DURATION_OPTIONS = [
  { label: '20 min — Quick Intro', value: 20 },
  { label: '30 min — Scoping Call', value: 30 },
  { label: '45 min — Deep Dive', value: 45 },
  { label: '60 min — Full Demo', value: 60 },
]

const TIME_SLOTS = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00',
]

export default function BookingModal({ lead, onClose }: BookingModalProps) {
  const [date, setDate]         = useState(format(addDays(new Date(), 1), 'yyyy-MM-dd'))
  const [time, setTime]         = useState('10:00')
  const [duration, setDuration] = useState(30)
  const [notes, setNotes]       = useState('')
  const [booking, setBooking]   = useState(false)
  const [success, setSuccess]   = useState<{ meetLink?: string; eventLink?: string } | null>(null)

  const handleBook = async () => {
    setBooking(true)
    try {
      const [hh, mm]    = time.split(':').map(Number)
      const startDate   = setMinutes(setHours(new Date(date), hh), mm)
      const endDate     = new Date(startDate.getTime() + duration * 60000)

      const res = await fetch('/api/calendar', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          summary:       `Scoping Call — ${lead.company} × Vertex AI Marketing`,
          description:   notes || undefined,
          startDateTime: startDate.toISOString(),
          endDateTime:   endDate.toISOString(),
          leadId:        lead.id,
          leadName:      lead.name,
          company:       lead.company,
          attendees: [{ email: lead.email, name: lead.name }],
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      setSuccess({ meetLink: data.meetLink, eventLink: data.eventLink })
      toast.success('Scoping call booked! Calendar invite sent.')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Booking failed'
      toast.error(message)
    } finally {
      setBooking(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg mx-4 bg-bg-1 border border-surface-border rounded-xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-surface-border">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
            <Calendar className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold text-slate-200">Schedule Scoping Call</div>
            <div className="text-xs text-slate-500">{lead.name} · {lead.company} · AI Score: {lead.aiScore}</div>
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-bg-2 text-slate-500 hover:text-slate-300 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {success ? (
          /* ── Success State ── */
          <div className="p-8 text-center">
            <div className="w-14 h-14 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-7 h-7 text-emerald-400" />
            </div>
            <div className="text-base font-semibold text-slate-200 mb-1">Booked!</div>
            <div className="text-xs text-slate-500 mb-5">
              Calendar invite sent to {lead.name} at {lead.email}<br/>
              Also saved to Google Sheets → Scoping Calls tab
            </div>
            {success.meetLink && (
              <a
                href={success.meetLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-brand-blue text-white text-xs font-semibold rounded-lg hover:bg-brand-blue-dim transition-colors mb-3 mr-2"
              >
                <Video className="w-3 h-3" /> Open Meet Link
              </a>
            )}
            {success.eventLink && (
              <a
                href={success.eventLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-bg-2 border border-surface-border text-slate-300 text-xs font-semibold rounded-lg hover:bg-bg-3 transition-colors mb-3"
              >
                <Calendar className="w-3 h-3" /> View in Calendar
              </a>
            )}
            <div><button onClick={onClose} className="text-xs text-slate-500 hover:text-slate-300 mt-2 transition-colors">Close</button></div>
          </div>
        ) : (
          /* ── Booking Form ── */
          <div className="p-5 space-y-4">
            {/* Date */}
            <div>
              <label className="block text-xs text-slate-500 font-medium uppercase tracking-wider mb-2">Date</label>
              <input
                type="date"
                value={date}
                min={format(new Date(), 'yyyy-MM-dd')}
                onChange={e => setDate(e.target.value)}
                className="w-full bg-bg-2 border border-surface-border rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:border-brand-blue transition-colors"
              />
            </div>

            {/* Time Slots */}
            <div>
              <label className="block text-xs text-slate-500 font-medium uppercase tracking-wider mb-2">Time (PHT)</label>
              <div className="grid grid-cols-5 gap-1.5">
                {TIME_SLOTS.map(t => (
                  <button
                    key={t}
                    onClick={() => setTime(t)}
                    className={`px-2 py-1.5 text-xs rounded-lg border transition-colors font-mono ${
                      time === t
                        ? 'bg-brand-blue border-brand-blue text-white'
                        : 'bg-bg-2 border-surface-border text-slate-400 hover:border-surface-border2 hover:text-slate-200'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Duration */}
            <div>
              <label className="block text-xs text-slate-500 font-medium uppercase tracking-wider mb-2">
                <Clock className="w-3 h-3 inline mr-1" />Duration
              </label>
              <div className="grid grid-cols-2 gap-2">
                {DURATION_OPTIONS.map(d => (
                  <button
                    key={d.value}
                    onClick={() => setDuration(d.value)}
                    className={`px-3 py-2 text-xs rounded-lg border transition-colors text-left ${
                      duration === d.value
                        ? 'bg-brand-blue/15 border-brand-blue/40 text-brand-blue'
                        : 'bg-bg-2 border-surface-border text-slate-400 hover:text-slate-200 hover:border-surface-border2'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Attendee info */}
            <div className="flex items-center gap-3 px-3 py-2.5 bg-bg-2 rounded-lg border border-surface-border">
              <Users className="w-4 h-4 text-slate-500 flex-shrink-0" />
              <div className="text-xs text-slate-400">
                Invite will be sent to <span className="text-slate-200 font-medium">{lead.email}</span>
                {' '}with a Google Meet link
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs text-slate-500 font-medium uppercase tracking-wider mb-2">Notes (optional)</label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder={`Custom agenda for ${lead.name}...`}
                rows={2}
                className="w-full bg-bg-2 border border-surface-border rounded-lg px-3 py-2 text-sm text-slate-300 placeholder-slate-600 outline-none focus:border-brand-blue transition-colors resize-none"
              />
            </div>

            {/* Summary */}
            <div className="text-xs text-slate-500 bg-bg-2/50 rounded-lg px-3 py-2 border border-surface-border">
              📅 {format(new Date(`${date}T${time}`), 'EEEE, MMMM d, yyyy')} at {time} PHT · {duration} min
            </div>

            {/* Footer */}
            <div className="flex items-center gap-3 pt-1">
              <button onClick={onClose} className="flex-1 px-4 py-2.5 text-xs text-slate-400 border border-surface-border rounded-lg hover:bg-bg-2 hover:text-slate-200 transition-colors">
                Cancel
              </button>
              <button
                onClick={handleBook}
                disabled={booking}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
              >
                {booking ? <Loader2 className="w-3 h-3 animate-spin" /> : <Calendar className="w-3 h-3" />}
                {booking ? 'Booking...' : 'Book & Send Invite'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
