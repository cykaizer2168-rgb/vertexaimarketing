'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeft, RefreshCw, CalendarPlus, MapPin, Check, X, Clock } from 'lucide-react';
import { useAppointments } from '@/lib/use-appointments';
import { useLeads } from '@/lib/use-leads';
import MonthCalendar from '@/components/crm/month-calendar';

const TYPES = ['assessment', 'call', 'install', 'followup'];
const STATUS_META: Record<string, { label: string; cls: string }> = {
  scheduled: { label: 'Scheduled', cls: 'text-blue-700 bg-blue-50 border-blue-100' },
  done: { label: 'Done', cls: 'text-green-700 bg-green-50 border-green-100' },
  cancelled: { label: 'Cancelled', cls: 'text-gray-500 bg-gray-50 border-gray-200' },
  no_show: { label: 'No-show', cls: 'text-red-600 bg-red-50 border-red-100' },
};

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
function toLocalInput(d: Date) {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}
function dayLabel(d: Date) {
  return d.toLocaleDateString('en-PH', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}

export default function CalendarPage() {
  const { appointments, loading, refetch } = useAppointments();
  const { leads } = useLeads();
  const [showForm, setShowForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [saving, setSaving] = useState(false);
  const [leadId, setLeadId] = useState('');
  const [title, setTitle] = useState('Site Assessment');
  const [type, setType] = useState('assessment');
  const [when, setWhen] = useState('');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');

  // Appointments on the selected calendar day (all statuses), earliest first.
  const dayAppointments = useMemo(
    () =>
      appointments
        .filter((a) => sameDay(new Date(a.scheduled_at), selectedDate))
        .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()),
    [appointments, selectedDate]
  );

  function openForm() {
    if (!when) setWhen(toLocalInput(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), 10, 0)));
    setShowForm((s) => !s);
  }

  // Clicking a calendar day opens the new-appointment form pre-filled for that day.
  function selectDay(d: Date) {
    setSelectedDate(d);
    setWhen(toLocalInput(new Date(d.getFullYear(), d.getMonth(), d.getDate(), 10, 0)));
    setShowForm(true);
  }

  async function save() {
    if (!leadId || !when) return;
    setSaving(true);
    await fetch('/api/appointments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        leadId,
        title,
        type,
        scheduledAt: new Date(when).toISOString(),
        location: location.trim() || undefined,
        notes: notes.trim() || undefined,
      }),
    }).catch(() => {});
    setSaving(false);
    setShowForm(false);
    setWhen('');
    setNotes('');
    refetch();
  }

  async function setStatus(id: string, status: string) {
    await fetch('/api/appointments', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    }).catch(() => {});
    refetch();
  }

  return (
    <>
      <div className="bg-white/65 backdrop-blur-2xl border-b border-black/[0.06] px-4 h-[50px] flex items-center gap-2 shrink-0">
        <span className="flex-1 text-[14px] font-semibold text-gray-800">Calendar</span>
        <button onClick={refetch} className="p-1.5 hover:bg-gray-100 rounded-lg cursor-pointer text-gray-500">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
        <button
          onClick={openForm}
          className="flex items-center gap-1.5 text-[12px] bg-amber-500 text-white rounded-lg px-3 py-1.5 hover:bg-amber-600 cursor-pointer"
        >
          <CalendarPlus className="w-3.5 h-3.5" />
          New appointment
        </button>
        <Link
          href="/crm"
          className="flex items-center gap-1 text-[12px] border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 cursor-pointer text-gray-700"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back
        </Link>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-4">
        <MonthCalendar
          appointments={appointments}
          selected={selectedDate}
          onPickDay={selectDay}
          onPickEvent={setSelectedDate}
        />

        {showForm && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
            onClick={() => setShowForm(false)}
          >
            <div
              className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <h2 className="text-[15px] font-semibold text-gray-900">New appointment · {dayLabel(selectedDate)}</h2>
                <button onClick={() => setShowForm(false)} className="p-1 text-gray-400 hover:text-gray-700 cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1 col-span-2">
                  <span className="text-[10px] font-medium text-gray-500 uppercase">Lead</span>
                  <select
                    value={leadId}
                    onChange={(e) => setLeadId(e.target.value)}
                    className="text-[12px] border border-gray-200 rounded-lg px-2 py-1.5 text-gray-700 bg-white"
                  >
                    <option value="">— Pumili ng lead —</option>
                    {leads.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.name} {l.mobile ? `(${l.mobile})` : ''}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-[10px] font-medium text-gray-500 uppercase">Title</span>
                  <input value={title} onChange={(e) => setTitle(e.target.value)} className="text-[12px] border border-gray-200 rounded-lg px-2 py-1.5 text-gray-700" />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-[10px] font-medium text-gray-500 uppercase">Type</span>
                  <select value={type} onChange={(e) => setType(e.target.value)} className="text-[12px] border border-gray-200 rounded-lg px-2 py-1.5 text-gray-700 bg-white">
                    {TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-[10px] font-medium text-gray-500 uppercase">When</span>
                  <input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} className="text-[12px] border border-gray-200 rounded-lg px-2 py-1.5 text-gray-700" />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-[10px] font-medium text-gray-500 uppercase">Location</span>
                  <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="(default: lead location)" className="text-[12px] border border-gray-200 rounded-lg px-2 py-1.5 text-gray-700" />
                </label>
                <label className="flex flex-col gap-1 col-span-2">
                  <span className="text-[10px] font-medium text-gray-500 uppercase">Notes</span>
                  <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="text-[12px] border border-gray-200 rounded-lg px-2 py-1.5 text-gray-700" />
                </label>
              </div>

              <div className="px-5 py-4 border-t border-gray-100 flex justify-end gap-2">
                <button
                  onClick={() => setShowForm(false)}
                  className="text-[12px] border border-gray-200 rounded-lg px-4 py-2 hover:bg-gray-50 cursor-pointer text-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={save}
                  disabled={saving || !leadId || !when}
                  className="text-[12px] bg-amber-500 text-white rounded-lg px-4 py-2 hover:bg-amber-600 disabled:opacity-50 cursor-pointer"
                >
                  {saving ? 'Saving…' : 'Save appointment'}
                </button>
              </div>
            </div>
          </div>
        )}

        <div>
          <div className="text-[12px] font-semibold text-gray-700 mb-2">{dayLabel(selectedDate)}</div>
          {loading ? (
            <div className="flex items-center justify-center py-10 text-[12px] text-gray-400 bg-white border border-gray-200 rounded-xl">
              <RefreshCw className="w-4 h-4 animate-spin mr-2" /> Loading…
            </div>
          ) : dayAppointments.length === 0 ? (
            <div className="py-10 text-center text-[12px] text-gray-400 bg-white border border-gray-200 rounded-xl">
              Walang appointment sa araw na ito — pindutin ang &quot;New appointment&quot;.
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100">
              {dayAppointments.map((a) => (
                <div key={a.id} className="px-4 py-3 flex items-center gap-3">
                  <div className="flex items-center gap-1.5 text-[12px] text-gray-600 w-28 shrink-0">
                    <Clock className="w-3.5 h-3.5 text-gray-400" />
                    {new Date(a.scheduled_at).toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit' })}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-medium text-gray-800">
                      {a.title} <span className="text-gray-400 font-normal">· {a.leads?.name ?? 'Lead'}</span>
                    </div>
                    <div className="text-[11px] text-gray-500 flex items-center gap-2 mt-0.5">
                      <span className="capitalize">{a.type}</span>
                      {a.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {a.location}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className={`text-[10px] font-medium rounded-full px-2 py-0.5 border ${STATUS_META[a.status]?.cls}`}>
                    {STATUS_META[a.status]?.label}
                  </span>
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => setStatus(a.id, 'done')} title="Done" className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg cursor-pointer">
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => setStatus(a.id, 'no_show')} title="No-show / Cancel" className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg cursor-pointer">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
