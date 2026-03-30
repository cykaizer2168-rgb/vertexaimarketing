'use client'
import { useEffect, useRef } from 'react'
import { Check } from 'lucide-react'
import type { LeadStatus } from '@/types'
import { STATUS_TEXT_COLORS } from './shared'

const STATUS_ORDER: LeadStatus[] = ['new', 'contacted', 'qualified', 'hot', 'nurture', 'closed']

interface Props {
  currentStatus: LeadStatus
  onSelect:      (status: LeadStatus) => void
  onClose:       () => void
}

export default function StatusDropdown({ currentStatus, onSelect, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleMouseDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('mousedown', handleMouseDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleMouseDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose])

  return (
    <div
      ref={ref}
      className="absolute top-full left-0 z-50 mt-1 w-36 bg-[#0f0f1a] border border-white/[0.1] rounded-lg shadow-xl overflow-hidden"
    >
      {STATUS_ORDER.map(status => (
        <button
          key={status}
          onClick={() => { onSelect(status); onClose() }}
          className="w-full flex items-center justify-between px-3 py-2 text-[12px] hover:bg-[#141425] transition-colors"
        >
          <span className={`capitalize font-medium ${STATUS_TEXT_COLORS[status] || 'text-slate-400'}`}>
            {status}
          </span>
          {status === currentStatus && (
            <Check className="w-3 h-3 text-slate-500 flex-shrink-0" />
          )}
        </button>
      ))}
    </div>
  )
}
