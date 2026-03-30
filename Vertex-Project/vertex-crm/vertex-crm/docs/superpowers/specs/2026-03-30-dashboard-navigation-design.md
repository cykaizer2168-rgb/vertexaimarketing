# Dashboard Navigation — Design Spec
**Date:** 2026-03-30
**Project:** Vertex AI Marketing CRM

---

## Overview

Add full navigation to the CRM dashboard. `dashboard/page.tsx` becomes a thin router that holds `activePage` state and renders one of six view components. Shared data (leads, logs, session) flows down as props.

---

## Architecture

### Router (`src/app/dashboard/page.tsx`)
- Holds: `activePage`, `leads`, `logs`, `emailLead`, `bookingLead`, `search`, `loading`
- Fetches leads once on mount, passes to all views
- Renders the correct view component based on `activePage`
- Sidebar and header remain in this file (shared across all views)

### View Components (`src/components/views/`)
| File | Nav Label | Side Panel |
|------|-----------|------------|
| `DashboardView.tsx` | Dashboard | AI Intelligence |
| `LeadsView.tsx` | Leads (Active) | AI Intelligence |
| `AIInsightsView.tsx` | AI Insights | AI Intelligence |
| `AutomationLogsView.tsx` | Automation Logs | AI Intelligence |
| `CalendarView.tsx` | Calendar | Hidden (full-width) |
| `SettingsView.tsx` | Settings | Hidden (full-width) |

### Side Panel
- Extracted to `src/components/views/AISidePanel.tsx`
- Shown for: Dashboard, Leads, AI Insights, Automation Logs
- Hidden for: Calendar, Settings (those views use full width)

---

## Nav Items

**Main section:**
- Dashboard (`LayoutDashboard`)
- Leads (Active) (`Users`) — badge: count of non-closed leads
- AI Insights (`Cpu`) — badge: alert count (amber)
- Calendar (`CalendarDays`) — NEW

**Automation section:**
- Automation Logs (`Activity`)
- Settings (`Settings`)

---

## View Specs

### Dashboard
No changes. Extracts to `DashboardView` — stat cards, hot leads table, outreach hooks.

### Leads (Active)
Same table as Dashboard but:
- Pre-filtered to `status !== 'closed'`
- All leads shown (no `slice`)
- Search applies across name, company, industry, email

### AI Insights
Four panels:
1. **Full AI Logs Feed** — all logs, scrollable, no 5-item cap
2. **Top Scored Leads** — sorted by `aiScore` desc, all leads
3. **Needs Follow-up** — `lastContacted` undefined OR older than 7 days from today
4. **Score Distribution** — 4 buckets: 85+ / 70–84 / 55–69 / <55, shown as labeled horizontal bars with count + percentage

### Automation Logs
Two panels:
1. **n8n Workflow Status Cards** — 5 static workflows, running/idle/error badges
2. **Action Log** — `logs` filtered to `email_sent`, `meeting_booked`, `workflow` types, with timestamp

### Calendar
- Calls `GET /api/calendar?days=30` on mount
- Weekly grid (7 columns × rows for each week in the range)
- Event cards show: lead name, company, time, duration, Google Meet button
- "Book New Call" button opens `BookingModal`
- Empty state if no events
- Loading skeleton while fetching

### Settings
- Reads from `GET /api/settings` on mount
- Fields: Sheet ID, Leads Tab, Scoping Tab, Chat Logs Tab, Calendly URL, Admin Email
- Google account section: shows avatar, name, email from session (read-only)
- Save button: `POST /api/settings` — writes to `settings.json` at project root
- Success/error toast on save
- Note: GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET remain in `.env.local` (not editable in UI)

---

## Settings API

### `GET /api/settings`
Reads `settings.json` from project root. If file missing, returns env-based defaults.

### `POST /api/settings`
Writes validated fields to `settings.json`. Requires authenticated session.

**`settings.json` shape:**
```json
{
  "sheetId": "...",
  "leadsTab": "Leads",
  "scopingTab": "Scoping Calls",
  "chatLogsTab": "Chat Logs",
  "calendlyUrl": "https://calendly.com/...",
  "adminEmail": "angelo@vertexaimarketing.cloud"
}
```

---

## Data Flow

- `leads` and `logs` fetched once in the router, passed as props to all views
- Calendar events fetched locally inside `CalendarView` (not shared)
- Settings fetched locally inside `SettingsView`
- No new shared state needed

---

## Out of Scope
- Real-time log streaming
- Lead detail drawer/modal
- n8n live API integration (workflow status remains static)
- `.env.local` editing (secrets stay in env)
