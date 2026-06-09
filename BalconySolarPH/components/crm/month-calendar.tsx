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

// A self-contained month grid (no deps). Shows a dot on days with scheduled
// appointments; clicking a day selects it.
export default function MonthCalendar({
  appointments,
  selected,
  onSelect,
}: {
  appointments: ApptWithLead[];
  selected: Date;
  onSelect: (d: Date) => void;
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

  const countByDay = useMemo(() => {
    const m: Record<string, number> = {};
    for (const a of appointments) {
      if (a.status !== 'scheduled') continue;
      const d = new Date(a.scheduled_at);
      const k = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      m[k] = (m[k] || 0) + 1;
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
          <button
            onClick={() => setView((v) => new Date(v.getFullYear(), v.getMonth() - 1, 1))}
            className="p-1 hover:bg-gray-100 rounded cursor-pointer text-gray-500"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setView(new Date(today.getFullYear(), today.getMonth(), 1))}
            className="text-[11px] px-2 py-0.5 hover:bg-gray-100 rounded cursor-pointer text-gray-600"
          >
            Today
          </button>
          <button
            onClick={() => setView((v) => new Date(v.getFullYear(), v.getMonth() + 1, 1))}
            className="p-1 hover:bg-gray-100 rounded cursor-pointer text-gray-500"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-1">
        {WD.map((w) => (
          <div key={w} className="text-[10px] font-medium text-gray-400 text-center py-1">
            {w}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((d, i) => {
          if (!d) return <div key={i} />;
          const k = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
          const count = countByDay[k] || 0;
          const isToday = sameDay(d, today);
          const isSel = sameDay(d, selected);
          return (
            <button
              key={i}
              onClick={() => onSelect(d)}
              className={`aspect-square rounded-lg flex flex-col items-center justify-center text-[12px] cursor-pointer border transition-colors ${
                isSel
                  ? 'bg-amber-500 text-white border-amber-500'
                  : isToday
                    ? 'border-amber-300 text-gray-800'
                    : 'border-transparent text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span>{d.getDate()}</span>
              {count > 0 && (
                <span className={`mt-0.5 w-1.5 h-1.5 rounded-full ${isSel ? 'bg-white' : 'bg-amber-500'}`} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
