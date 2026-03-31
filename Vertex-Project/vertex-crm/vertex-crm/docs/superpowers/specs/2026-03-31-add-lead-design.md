# Add Lead Design

## Goal

Wire up the existing "+ Add Lead" button in DashboardView and LeadsView to open a modal form that appends a new lead to Google Sheets and adds it to the in-memory leads list immediately.

## Architecture

`AddLeadModal.tsx` is a controlled modal component. Open/close state lives in `dashboard/page.tsx`, the same pattern used for the email and booking modals. Both `DashboardView` and `LeadsView` receive an `onAddLead` prop; clicking "+ Add Lead" calls it.

On submit, the handler in `page.tsx`:
1. Closes the modal immediately
2. Prepends an optimistic lead to `leads` state (generated id, `status: 'new'`, `aiScore: 0`, `source: 'manual'`)
3. POSTs to `POST /api/leads`
4. On success: shows `toast.success('Lead added')`
5. On failure: removes the optimistic lead and shows `toast.error('Failed to add lead')`

The optimistic lead uses `sheetRow: 0` as a placeholder. After the POST succeeds, the returned `sheetRow` from the API replaces it via a `setLeads` update.

## Form Fields

| Field | Input type | Required | Notes |
|-------|-----------|----------|-------|
| Name | text | ✓ | |
| Email | email | ✓ | |
| Company | text | ✓ | |
| Industry | select | ✓ | Preset list + "Other" option reveals free-text input |
| Phone | text | — | |
| Pain Points | textarea | — | 3 rows |

Industry preset options (in order):
- Real Estate
- E-Commerce / Retail
- Food & Beverage
- Healthcare / Medical
- Logistics / Freight
- Construction / Engineering
- Finance / Insurance
- Education / Training
- BPO / Outsourcing
- Technology / SaaS
- Manufacturing
- Other

When "Other" is selected, a second text input appears below the dropdown for free-text entry. The free-text value is used as the `industry` field value.

Estimated value defaults to `0`. AI score, suggested automation, outreach hook, estimated ROI all default to blank/0 — these are AI-generated fields populated later.

## API

### `POST /api/leads`

Request body:
```ts
{
  name:       string
  email:      string
  company:    string
  industry:   string
  phone?:     string
  painPoints?: string
}
```

Response:
```ts
{ success: true, sheetRow: number }
```

Calls `appendLead()` in `src/lib/sheets.ts`. Requires an authenticated session (same auth check as GET and PATCH).

## `appendLead()` in `src/lib/sheets.ts`

Appends one row to the Leads tab using `spreadsheets.values.append`. Column order matches the existing `COLS` array:

```
name | email | phone | company | industry | pain_points |
ai_score(0) | suggested_automation('') | estimated_roi('') | outreach_hook('') |
status('new') | estimated_value('0') | source('manual') | created_at(ISO) | last_contacted('')
```

Returns the `sheetRow` of the newly appended row, derived from `updatedRange` in the Sheets API response.

## Modal UX

- Opens as a centered overlay with a dark backdrop (`bg-black/60`)
- Matches existing modal style used by `AISidePanel` (dark card, `bg-[#0f0f1a]`, blue accent)
- Close on backdrop click or Escape key
- Submit button disabled while form is submitting (shows spinner)
- Client-side validation: all required fields must be non-empty before submit is enabled
- "Other" industry reveal: conditionally rendered text input below the select

## Files Modified / Created

| Action | File |
|--------|------|
| Create | `src/components/views/AddLeadModal.tsx` |
| Modify | `src/lib/sheets.ts` — add `appendLead()` |
| Modify | `src/app/api/leads/route.ts` — add POST handler |
| Modify | `src/app/dashboard/page.tsx` — `showAddLead` state, `handleAddLead` handler, pass `onAddLead` to views |
| Modify | `src/components/views/DashboardView.tsx` — `onAddLead?: () => void` prop, wire "+ Add Lead" button |
| Modify | `src/components/views/LeadsView.tsx` — `onAddLead?: () => void` prop, wire "+ Add Lead" button |

## Out of Scope

- Editing existing leads
- Bulk import from CSV
- AI scoring on add (score stays 0 until enriched externally)
- Duplicate detection
- Lead assignment / owner field
