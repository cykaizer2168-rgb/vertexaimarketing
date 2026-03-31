# Lead Status Update Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow authenticated users to change a lead's status inline from the leads table, writing the change back to Google Sheets immediately with optimistic UI and rollback on failure.

**Architecture:** A `StatusDropdown` component renders inside the status cell when clicked; `LeadsTable` tracks which dropdown is open via local `openId` state; `DashboardPage` owns the optimistic update logic and fires `PATCH /api/leads` in the background.

**Tech Stack:** Next.js 14 App Router, React, TypeScript, Tailwind CSS, react-hot-toast, Google Sheets API (via existing `updateLeadStatus` in `src/lib/sheets.ts`)

---

## Context

- `PATCH /api/leads` already exists at `src/app/api/leads/route.ts:21-37` — no changes needed there.
- `STATUS_COLORS` in `src/components/views/shared.tsx` holds Tailwind class strings like `'text-red-400 bg-red-500/10 border-red-500/20'`.
- `LeadStatus` type in `src/types/index.ts:2`: `'new' | 'contacted' | 'qualified' | 'hot' | 'nurture' | 'closed'`
- `LeadsTable` is exported from `src/components/views/DashboardView.tsx` and used by both `DashboardView` and `LeadsView`.
- `sharedProps` in `src/app/dashboard/page.tsx` is spread into `<DashboardView>` and `<LeadsView>`.

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| Modify | `src/components/views/shared.tsx` | Add `STATUS_TEXT_COLORS` export |
| Create | `src/components/views/StatusDropdown.tsx` | Inline status picker dropdown |
| Modify | `src/components/views/DashboardView.tsx` | `LeadsTable` — interactive status cell |
| Modify | `src/app/dashboard/page.tsx` | `handleStatusChange` + sharedProps |

---

### Task 1: Add `STATUS_TEXT_COLORS` to shared.tsx

**Files:**
- Modify: `src/components/views/shared.tsx`

- [ ] **Step 1: Add the export after `STATUS_COLORS`**

Open `src/components/views/shared.tsx`. After the closing `}` of `STATUS_COLORS`, add:

```tsx
export const STATUS_TEXT_COLORS: Record<string, string> = {
  hot:       'text-red-400',
  qualified: 'text-blue-400',
  contacted: 'text-amber-400',
  nurture:   'text-purple-400',
  new:       'text-slate-400',
  closed:    'text-emerald-400',
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no output (zero errors).

- [ ] **Step 3: Commit**

```bash
git add src/components/views/shared.tsx
git commit -m "feat: add STATUS_TEXT_COLORS to shared constants"
```

---

### Task 2: Create `StatusDropdown` component

**Files:**
- Create: `src/components/views/StatusDropdown.tsx`

- [ ] **Step 1: Create the file**

Create `src/components/views/StatusDropdown.tsx` with this exact content:

```tsx
'use client'
import { useEffect, useRef } from 'react'
import { Check } from 'lucide-react'
import type { LeadStatus } from '@/types'
import { STATUS_COLORS, STATUS_TEXT_COLORS } from './shared'

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
```

Note: `STATUS_COLORS` is imported but not used here — remove it from the import line. The correct import is:

```tsx
import { STATUS_TEXT_COLORS } from './shared'
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add src/components/views/StatusDropdown.tsx
git commit -m "feat: add StatusDropdown component"
```

---

### Task 3: Make `LeadsTable` status cell interactive

**Files:**
- Modify: `src/components/views/DashboardView.tsx`

The `LeadsTable` function starts at line 118. It currently accepts:
```ts
{ leads, authenticated, onEmailLead, onBookingLead }
```

- [ ] **Step 1: Add imports**

At the top of `src/components/views/DashboardView.tsx`, the existing import line is:
```tsx
import type { Lead } from '@/types'
```

Change it to:
```tsx
import type { Lead, LeadStatus } from '@/types'
```

Also add the StatusDropdown import after the existing component imports:
```tsx
import StatusDropdown from './StatusDropdown'
```

And add `useState` to the React import (currently none — add it):
```tsx
import { useState } from 'react'
```

- [ ] **Step 2: Update `LeadsTable` props interface and signature**

Find the `LeadsTable` function at line 118. Change its interface and destructuring:

```tsx
export function LeadsTable({ leads, authenticated, onEmailLead, onBookingLead, onStatusChange }: {
  leads:           Lead[]
  authenticated:   boolean
  onEmailLead:     (lead: Lead) => void
  onBookingLead:   (lead: Lead) => void
  onStatusChange?: (lead: Lead, status: LeadStatus) => void
}) {
  const [openId, setOpenId] = useState<string | null>(null)
```

- [ ] **Step 3: Update the status cell**

Find the status `<td>` inside `LeadsTable`. It currently reads:
```tsx
<td className="px-4 py-3">
  <span className={`text-[11px] px-2 py-0.5 rounded border font-medium capitalize ${STATUS_COLORS[lead.status] || STATUS_COLORS.new}`}>
    {lead.status}
  </span>
</td>
```

Replace it with:
```tsx
<td className="px-4 py-3">
  <div className="relative inline-block">
    <span
      onClick={() => onStatusChange && setOpenId(openId === lead.id ? null : lead.id)}
      className={`text-[11px] px-2 py-0.5 rounded border font-medium capitalize ${STATUS_COLORS[lead.status] || STATUS_COLORS.new} ${onStatusChange ? 'cursor-pointer hover:ring-1 hover:ring-white/20' : ''}`}
    >
      {lead.status}
    </span>
    {onStatusChange && openId === lead.id && (
      <StatusDropdown
        currentStatus={lead.status}
        onSelect={status => onStatusChange(lead, status)}
        onClose={() => setOpenId(null)}
      />
    )}
  </div>
</td>
```

- [ ] **Step 4: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no output.

- [ ] **Step 5: Verify build**

```bash
npm run build 2>&1 | tail -5
```

Expected: `✓ Compiled successfully`

- [ ] **Step 6: Commit**

```bash
git add src/components/views/DashboardView.tsx
git commit -m "feat: make LeadsTable status cell interactive"
```

---

### Task 4: Add `handleStatusChange` to `DashboardPage`

**Files:**
- Modify: `src/app/dashboard/page.tsx`

- [ ] **Step 1: Add the handler**

In `src/app/dashboard/page.tsx`, find the `sharedProps` object (around line 78). Add `handleStatusChange` as a new function just above it:

```tsx
async function handleStatusChange(lead: Lead, status: LeadStatus) {
  const prev = leads
  setLeads(leads.map(l => l.id === lead.id ? { ...l, status } : l))
  try {
    const res = await fetch('/api/leads', {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ id: lead.id, sheetRow: lead.sheetRow, status }),
    })
    if (!res.ok) throw new Error('Update failed')
    toast.success('Status updated')
  } catch {
    setLeads(prev)
    toast.error('Failed to update status')
  }
}
```

- [ ] **Step 2: Add `LeadStatus` to the type import**

Find the import at the top:
```tsx
import type { Lead, AILog } from '@/types'
```

Change to:
```tsx
import type { Lead, AILog, LeadStatus } from '@/types'
```

- [ ] **Step 3: Add `onStatusChange` to `sharedProps`**

Find the `sharedProps` object and add one line:

```tsx
const sharedProps = {
  leads,
  search,
  authenticated,
  onEmailLead:    setEmailLead,
  onBookingLead:  setBookingLead,
  onSignIn:       () => signIn('google'),
  onStatusChange: authenticated ? handleStatusChange : undefined,
}
```

- [ ] **Step 4: Update `DashboardView` and `LeadsView` Props interfaces to accept `onStatusChange`**

In `src/components/views/DashboardView.tsx`, find the `Props` interface at the top and add:
```tsx
interface Props {
  leads:           Lead[]
  search:          string
  authenticated:   boolean
  onEmailLead:     (lead: Lead) => void
  onBookingLead:   (lead: Lead) => void
  onSignIn:        () => void
  onStatusChange?: (lead: Lead, status: LeadStatus) => void
}
```

Update the destructuring in `DashboardView`:
```tsx
export default function DashboardView({
  leads, search, authenticated, onEmailLead, onBookingLead, onSignIn, onStatusChange
}: Props) {
```

Pass it through to `LeadsTable` in `DashboardView`:
```tsx
<LeadsTable leads={filtered} authenticated={authenticated} onEmailLead={onEmailLead} onBookingLead={onBookingLead} onStatusChange={onStatusChange} />
```

In `src/components/views/LeadsView.tsx`, add the same prop to the `Props` interface and destructuring:
```tsx
interface Props {
  leads:           Lead[]
  search:          string
  authenticated:   boolean
  onEmailLead:     (lead: Lead) => void
  onBookingLead:   (lead: Lead) => void
  onSignIn:        () => void
  onStatusChange?: (lead: Lead, status: LeadStatus) => void
}

export default function LeadsView({ leads, search, authenticated, onEmailLead, onBookingLead, onStatusChange }: Props) {
```

Also add `LeadStatus` to the import in `LeadsView.tsx`:
```tsx
import type { Lead, LeadStatus } from '@/types'
```

And pass it through to `LeadsTable` in `LeadsView`:
```tsx
<LeadsTable leads={filtered} authenticated={authenticated} onEmailLead={onEmailLead} onBookingLead={onBookingLead} onStatusChange={onStatusChange} />
```

- [ ] **Step 5: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no output.

- [ ] **Step 6: Verify build**

```bash
npm run build 2>&1 | tail -5
```

Expected: `✓ Compiled successfully`

- [ ] **Step 7: Commit**

```bash
git add src/app/dashboard/page.tsx src/components/views/DashboardView.tsx src/components/views/LeadsView.tsx
git commit -m "feat: wire handleStatusChange with optimistic update"
```

---

### Task 5: Manual verification

- [ ] **Step 1: Start dev server (if not running)**

```bash
npm run dev
```

Open `http://localhost:3000/dashboard`

- [ ] **Step 2: Verify unauthenticated state**

Sign out (or open in incognito). Navigate to Dashboard. Click a status badge in the leads table.

Expected: nothing happens — badge is static, no dropdown appears.

- [ ] **Step 3: Verify authenticated dropdown opens**

Sign in with Google. Navigate to Dashboard or Leads (Active). Click a status badge.

Expected:
- Dropdown appears below the badge listing all 6 statuses in order: new, contacted, qualified, hot, nurture, closed
- Current status has a checkmark
- Each status is the correct color (red for hot, blue for qualified, amber for contacted, etc.)

- [ ] **Step 4: Verify status change**

Click a different status in the dropdown.

Expected:
- Dropdown closes immediately
- Badge in the table updates instantly (optimistic)
- Toast appears: "Status updated"
- Refreshing the page shows the new status (confirming Sheets write)

- [ ] **Step 5: Verify outside-click and Escape**

Open a dropdown. Click anywhere outside it.
Expected: dropdown closes, no status change.

Open a dropdown. Press Escape.
Expected: dropdown closes, no status change.

- [ ] **Step 6: Final commit if any fixes were needed**

```bash
git add -A
git commit -m "fix: lead status update manual verification fixes"
```

Only run this step if you made changes during verification.
