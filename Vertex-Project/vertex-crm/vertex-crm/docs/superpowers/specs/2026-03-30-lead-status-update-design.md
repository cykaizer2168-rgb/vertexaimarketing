# Lead Status Update Design

## Goal

Allow users to change a lead's status inline from the leads table, with the change written back to Google Sheets immediately.

## Architecture

Four pieces:

1. **`PATCH /api/leads`** — new handler added to the existing `src/app/api/leads/route.ts`. Accepts `{ id, sheetRow, status }`, calls the existing `updateLeadStatus(sheetRow, status)` from `src/lib/sheets.ts`, returns `{ ok: true }`. Session-guarded — returns 401 if unauthenticated.

2. **`StatusDropdown`** — new component at `src/components/views/StatusDropdown.tsx`. An absolute-positioned card listing all 6 statuses in pipeline order. Closes on outside click (document `mousedown` listener) or Escape key. Receives `currentStatus` and `onSelect` callback.

3. **`LeadsTable`** — gains an optional `onStatusChange?: (lead: Lead, status: LeadStatus) => void` prop. When provided, the status badge becomes clickable (`cursor-pointer`, hover ring). Only one `StatusDropdown` is open at a time (tracked by `openId` local state in `LeadsTable`).

4. **`DashboardPage`** — adds `handleStatusChange` implementing the optimistic update pattern. `onStatusChange` is only passed to `LeadsTable` when the user is authenticated.

## Data Flow

```
user clicks status badge
→ StatusDropdown opens (current status highlighted with checkmark)
→ user selects new status
→ onStatusChange(lead, newStatus) fires
→ DashboardPage: optimistically patches leads[] state
→ PATCH /api/leads { id, sheetRow, status }
→ success: toast.success('Status updated')
→ failure: rollback leads[] to previous state + toast.error
```

## Component Details

### StatusDropdown

- Renders below the clicked badge using `absolute` positioning; no React portal needed
- Status order: new → contacted → qualified → hot → nurture → closed
- Uses `STATUS_COLORS` from `shared.tsx` for consistent color tokens
- Current status shows a checkmark icon
- `useEffect` on mount attaches `mousedown` to `document` for outside-click dismissal; cleaned up on unmount

### LeadsTable changes

- New optional prop: `onStatusChange?: (lead: Lead, status: LeadStatus) => void`
- New local state: `openId: string | null` — ID of the lead whose dropdown is open
- Status cell: `position: relative` wrapper, badge renders `StatusDropdown` when `openId === lead.id`
- When `onStatusChange` is undefined (unauthenticated), badge is static (no change from current behaviour)

### DashboardPage changes

- New handler:
  ```ts
  async function handleStatusChange(lead: Lead, status: LeadStatus) {
    const prev = leads
    setLeads(leads.map(l => l.id === lead.id ? { ...l, status } : l))
    try {
      const res = await fetch('/api/leads', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: lead.id, sheetRow: lead.sheetRow, status }),
      })
      if (!res.ok) throw new Error('Failed')
      toast.success('Status updated')
    } catch {
      setLeads(prev)
      toast.error('Failed to update status')
    }
  }
  ```
- `sharedProps` gains `onStatusChange: authenticated ? handleStatusChange : undefined`

### PATCH /api/leads

```ts
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { sheetRow, status } = await req.json()
  if (!sheetRow || !status) {
    return NextResponse.json({ error: 'Missing sheetRow or status' }, { status: 400 })
  }
  await updateLeadStatus(sheetRow, status)
  return NextResponse.json({ ok: true })
}
```

## Files Modified / Created

| Action | File |
|--------|------|
| Modify | `src/app/api/leads/route.ts` — add PATCH handler |
| Create | `src/components/views/StatusDropdown.tsx` |
| Modify | `src/components/views/DashboardView.tsx` — LeadsTable interactive status cell |
| Modify | `src/app/dashboard/page.tsx` — handleStatusChange + sharedProps update |

## Out of Scope

- Editing any other lead fields (name, email, estimated value, etc.)
- Bulk status updates
- Status change history / audit log
- Filtering leads by status from the table header (separate feature)
