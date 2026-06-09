'use client';

import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { ApptWithLead } from '@/lib/use-appointments';

const WD = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MO = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
function shortTime(dt: string) {
  return new Date(dt).toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit' }).replace(' ', '');
}

// Month grid with Google-Calendar-style event chips inside each day cell.
// Click an empty part of a day -> onPickDay (book). Click an event -> onPickEvent.
export default function MonthCalendar({
  appointments,
  selected,
  onPickDay,
  onPickEvent,
}: {
  appointments: ApptWithLead[];
  selected: Date;
  onPickDay: (d: Date) => void;
  onPickEvent: (d: Date) => void;
}) {
  const today = new Date();
  const [view, setView] = useState(() => new Date(selected.getFullYear(), selected.getMonth(), 1));

  const cells = useMemo(() => {
    const year = view.getFullYear();
    const month = view.getMonth();
    const startPad = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const arr: (Date | null)[] = [];
    for (let i = 0; i < startPad; i++) arr.push(null);
    for (let d = 1; d <= daysInMonth; d++) arr.push(new Date(year, month, d));
    while (arr.length % 7 !== 0) arr.push(null);
    return arr;
  }, [view]);

  // Active appointments (scheduled/done) grouped by day, earliest first.
  const byDay = useMemo(() => {
    const m: Record<string, ApptWithLead[]> = {};
    for (const a of appointments) {
      if (a.status === 'cancelled' || a.status === 'no_show') continue;
      const d = new Date(a.scheduled_at);
      const k = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      (m[k] ||= []).push(a);
    }
    for (const k of Object.keys(m)) {
      m[k].sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());
    }
    return m;
  }, [appointments]);

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[13px] font-semibold text-gray-800">
          {MO[view.getMonth()]} {view.getFullYear()}
        </span>
        <div className="flex items-center gap-1">
          <button onClick={() => setView((v) => new Date(v.getFullYear(), v.getMonth() - 1, 1))} className="p-1 hover:bg-gray-100 rounded cursor-pointer text-gray-500">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button onClick={() => setView(new Date(today.getFullYear(), today.getMonth(), 1))} className="text-[11px] px-2 py-0.5 hover:bg-gray-100 rounded cursor-pointer text-gray-600">
            Today
          </button>
          <button onClick={() => setView((v) => new Date(v.getFullYear(), v.getMonth() + 1, 1))} className="p-1 hover:bg-gray-100 rounded cursor-pointer text-gray-500">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-1">
        {WD.map((w) => (
          <div key={w} className="text-[10px] font-medium text-gray-400 text-center py-1">{w}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((d, i) => {
          if (!d) return <div key={i} className="min-h-[92px]" />;
          const k = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
          const items = byDay[k] || [];
          const isToday = sameDay(d, today);
          const isSel = sameDay(d, selected);
          return (
            <div
              key={i}
              onClick={() => onPickDay(d)}
              className={`min-h-[92px] rounded-lg border p-1 cursor-pointer flex flex-col gap-0.5 overflow-hidden ${
                isSel ? 'border-amber-400 bg-amber-50/40' : 'border-gray-100 hover:bg-gray-50'
              }`}
            >
              <div
                className={`text-[11px] font-medium self-start rounded-full w-5 h-5 flex items-center justify-center ${
                  isToday ? 'bg-amber-500 text-white' : 'text-gray-600'
                }`}
              >
                {d.getDate()}
              </div>
              {items.slice(0, 3).map((a) => (
                <button
                  key={a.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onPickEvent(d);
                  }}
                  title={`${shortTime(a.scheduled_at)} ${a.title ?? ''} · ${a.leads?.name ?? ''}`}
                  className={`text-left text-[9px] leading-tight rounded px-1 py-0.5 truncate cursor-pointer ${
                    a.status === 'done'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                  }`}
                >
                  <span className="font-semibold">{shortTime(a.scheduled_at)}</span> {a.title}
                </button>
              ))}
              {items.length > 3 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onPickEvent(d);
                  }}
                  className="text-[9px] text-gray-400 hover:text-gray-600 text-left cursor-pointer"
                >
                  +{items.length - 3} more
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
