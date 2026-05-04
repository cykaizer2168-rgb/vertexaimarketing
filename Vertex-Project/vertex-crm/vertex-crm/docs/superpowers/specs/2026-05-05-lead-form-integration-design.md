# Lead Form Integration — Design Spec
**Date:** 2026-05-05  
**Project:** Vertex CRM (`vertex-crm-two.vercel.app`)

---

## Goal

When a visitor submits the landing page lead form, they are automatically added to the CRM as a full lead (status: `new`, source: `landing_page`) **and** a copy is stored in the Landing Page Leads tab so the existing `LandingDataView` history is preserved.

---

## Architecture

```
Landing Page Form (vertex-ai-marketing.html)
        │
        │  POST /api/inbound-lead
        │  Header: x-api-key: <INBOUND_LEAD_API_KEY>
        │  Body: { name, mobile, email, business, plan, preferredDate }
        ▼
CRM API Route (/api/inbound-lead)
        │
        ├──▶ sheets.appendLead()        → writes to CRM "Leads" tab
        └──▶ sheets.appendLandingLead() → writes to "Landing Page Leads" tab
```

No polling. No Apps Script dependency. Single POST, two writes.

---

## New Files / Changes

### 1. `src/app/api/inbound-lead/route.ts` (new)

- **Method:** POST only
- **Auth:** API key via `x-api-key` header, compared to `process.env.INBOUND_LEAD_API_KEY`
- **Returns:** `{ success: true }` on success, `{ error: '...' }` with appropriate HTTP status on failure
- **CORS:** Allows `*` origin so the static HTML page can POST cross-origin

**Request body:**
```ts
{
  name:          string   // Full Name
  mobile:        string   // Mobile Number
  email:         string   // Email Address
  business:      string   // Business Name
  plan:          string   // e.g. "Standard Business Ready — ₱2,499" or ""
  preferredDate: string   // ISO date string e.g. "2026-05-10" or ""
}
```

**Field mapping to Lead sheet row:**

| Sheet column       | Value |
|--------------------|-------|
| `name`             | `body.name` |
| `email`            | `body.email` |
| `phone`            | `body.mobile` |
| `company`          | `body.business` |
| `industry`         | `""` |
| `pain_points`      | `"Plan: {plan} | Preferred Date: {preferredDate}"` |
| `ai_score`         | `0` |
| `suggested_automation` | `""` |
| `estimated_roi`    | `""` |
| `outreach_hook`    | `""` |
| `status`           | `"new"` |
| `estimated_value`  | Parsed from plan: `999` / `2499` / `4999` / `0` |
| `source`           | `"landing_page"` |
| `created_at`       | ISO timestamp (Manila timezone) |
| `last_contacted`   | `""` |

**Estimated value parsing:**
- Contains "999" and not "2,499" and not "4,999" → `999`
- Contains "2,499" → `2499`
- Contains "4,999" → `4999`
- Otherwise → `0`

---

### 2. `src/lib/sheets.ts` (update)

Add `appendLandingLead(data)` function that writes a row to the `GOOGLE_SHEET_LANDING_LEADS_TAB` tab using the **service account client** (`getSheetsServiceClient`), since landing page writes must not require a user OAuth session.

> **One-time setup required:** The service account email (`GOOGLE_SERVICE_ACCOUNT_EMAIL`) must be granted **Editor** access on the CRM Google Sheet. Currently it only has read access for the landing page sheet.

**Columns written:**
`timestamp`, `name`, `mobile`, `email`, `business`, `plan`, `preferred_date`

If the tab is empty, write a header row first.

---

### 3. `public/vertex-ai-marketing.html` (update)

Replace `SCRIPT_URL` with the CRM inbound endpoint:
```js
const SCRIPT_URL = 'https://vertex-crm-two.vercel.app/api/inbound-lead';
```

Add `x-api-key` header to the fetch call (value comes from a `data-` attribute on the form or is hardcoded — acceptable for a public lead form).

---

### 4. Vercel Environment Variable (new)

`INBOUND_LEAD_API_KEY` — a secret string used to authenticate inbound POST requests from the landing page.

---

## Error Handling

- Missing/invalid API key → `401 Unauthorized`
- Missing required fields (`name`, `email`, `mobile`, `business`) → `400 Bad Request`
- Sheet write failure → log error, return `500`, landing page shows success anyway (UX: don't penalise the user for a backend error)

---

## Out of Scope

- Deduplication (same email submitting twice)
- n8n webhook trigger on inbound lead (can be added later)
- Auto-booking the preferred date on Google Calendar
