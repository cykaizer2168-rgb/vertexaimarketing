# Vertex AI Marketing CRM
> Enterprise-grade AI-powered CRM — Next.js 14 + Google OAuth + Gmail + Google Calendar + n8n

---

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 14 (App Router) + Tailwind CSS + Lucide React |
| Auth | NextAuth.js v4 — Google OAuth 2.0 |
| Email | Gmail API (send branded emails, read threads) |
| Calendar | Google Calendar API (create events + Google Meet links) |
| CRM Data | Google Sheets API (Leads, Scoping Calls, Chat Logs tabs) |
| Automation | n8n webhook integration |
| AI Scoring | GPT-4o via n8n AI node |

---

## Quick Start

```bash
# 1. Clone / copy this folder to your machine
cd vertex-crm

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.local.example .env.local
# → Edit .env.local with your actual keys (see setup below)

# 4. Run dev server
npm run dev
# → Open http://localhost:3000
```

---

## Google Cloud Setup (One-Time)

### Step 1 — Create a Google Cloud Project

1. Go to https://console.cloud.google.com
2. Create a new project: `vertex-ai-crm`
3. Enable these APIs:
   - **Gmail API**
   - **Google Calendar API**
   - **Google Sheets API**
   - **Google+ API** (for OAuth profile)

### Step 2 — OAuth 2.0 Credentials

1. Go to **APIs & Services → Credentials**
2. Click **Create Credentials → OAuth 2.0 Client IDs**
3. Application type: **Web application**
4. Name: `Vertex CRM`
5. Authorized redirect URIs:
   ```
   http://localhost:3000/api/auth/callback/google
   https://YOUR-DOMAIN.vercel.app/api/auth/callback/google
   ```
6. Copy **Client ID** and **Client Secret** → paste in `.env.local`

### Step 3 — OAuth Consent Screen

1. Go to **APIs & Services → OAuth consent screen**
2. User type: **Internal** (or External if needed)
3. Add scopes:
   - `https://mail.google.com/`
   - `https://www.googleapis.com/auth/gmail.send`
   - `https://www.googleapis.com/auth/gmail.modify`
   - `https://www.googleapis.com/auth/calendar`
   - `https://www.googleapis.com/auth/spreadsheets`
4. Add your email as a test user

---

## Google Sheets Structure

Your CRM sheet ID: `1i_fOiBvvMywjgecXOwXisO5Cge8D3V-k8hvhfR7djt4`

### Tab 1: `Leads`
Columns (Row 1 = headers, data starts Row 2):
```
A: row_number | B: name | C: email | D: phone | E: company
F: industry   | G: pain_points | H: ai_score | I: suggested_automation
J: estimated_roi | K: outreach_hook | L: status | M: estimated_value
N: source | O: created_at | P: last_contacted
```

### Tab 2: `Scoping Calls`
```
A: lead_name | B: lead_email | C: company | D: scheduled_at
E: duration_minutes | F: notes | G: google_event_id | H: meet_link | I: created_at
```

### Tab 3: `Chat Logs`
```
A: lead_name | B: message | C: response | D: timestamp
```

---

## n8n Integration

Your existing webhook: `https://n8n.srv1356414.hstgr.cloud/webhook/vertex`
Workflow ID: `j3hhCaHbY57PGdxJFFXlQ`

### Events the CRM sends to n8n:

| Event type | Trigger |
|---|---|
| `email_sent` | After sending email via Gmail |
| `meeting_booked` | After creating calendar event |
| `lead_status_updated` | After changing status in table |

### n8n AI Scoring System Prompt (for your AI node):

```
You are the Lead Intelligence Engine for Vertex AI Marketing.
Analyze the lead data and return STRICT JSON only — no preamble, no markdown.

Input: company, industry, painPoints

Output JSON:
{
  "ai_readiness_score": <0-100>,
  "primary_recommendation": "<specific automation tool>",
  "estimated_roi": "<brief time/money savings>",
  "outreach_hook": "<1 sentence personalized cold email opener>"
}

Scoring criteria:
- 85-100: High complexity processes, clear AI use cases, enterprise budget signals
- 70-84: Medium automation opportunity, SME scale
- 55-69: Early stage, needs education first
- Below 55: Not ready yet

Tone: Professional, technical, value-driven. Filipino SME context.
```

---

## Deployment to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set env vars in Vercel dashboard:
# Settings → Environment Variables → paste all from .env.local
# IMPORTANT: Update NEXTAUTH_URL to your Vercel URL
# IMPORTANT: Add Vercel URL to Google OAuth redirect URIs
```

---

## File Structure

```
vertex-crm/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/[...nextauth]/route.ts   ← Google OAuth
│   │   │   ├── leads/route.ts                ← GET/PATCH leads
│   │   │   ├── send-email/route.ts           ← Gmail send + read
│   │   │   └── calendar/route.ts             ← Create/list/delete events
│   │   ├── auth/signin/page.tsx              ← Google sign-in UI
│   │   ├── dashboard/page.tsx                ← Main CRM dashboard
│   │   ├── layout.tsx
│   │   ├── providers.tsx                     ← NextAuth SessionProvider
│   │   └── globals.css
│   ├── components/
│   │   ├── email/EmailModal.tsx              ← Compose + send email modal
│   │   └── calendar/BookingModal.tsx         ← Schedule scoping call modal
│   ├── lib/
│   │   ├── google.ts                         ← OAuth2 client factory
│   │   └── sheets.ts                         ← Google Sheets CRUD
│   └── types/
│       ├── index.ts                          ← All TypeScript types
│       └── next-auth.d.ts                    ← Session type augmentation
├── .env.local.example                        ← Copy to .env.local
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## Features

### ✅ Dashboard
- 4 stat cards: Total Leads, Avg AI Readiness, Pipeline Value, Active Automations
- Hot Leads table with AI Score badges, automation pills, status selectors
- AI Outreach Hooks grid (click any card to open email modal)
- AI Intelligence feed (live log of enrichments, scores, alerts)
- n8n Workflow status panel

### ✅ Email (Gmail API)
- Send branded HTML emails directly from the CRM
- 3 AI templates: Outreach Hook, Scoping Call Invite, Follow-Up
- Auto-updates `last_contacted` in Google Sheets after sending
- Fires n8n webhook with `email_sent` event
- View email threads per lead

### ✅ Calendar (Google Calendar API)
- Book scoping calls with Google Meet link auto-generated
- Time slot picker (PHT timezone)
- Duration options: 20/30/45/60 min
- Calendar invite sent to lead automatically
- Saves to `Scoping Calls` tab in Google Sheets
- Fires n8n webhook with `meeting_booked` event

### 🔄 Swapping Mock Data → Live Sheets
In `src/app/dashboard/page.tsx`, the `fetchLeads()` function already calls `/api/leads`.
Once you add your Google Sheet data and sign in with Google, it auto-loads real data.
Mock data is the fallback if the API call fails.

---

## Demo Flow (Para sa Clients)

1. Open dashboard → show stat cards, hot leads table
2. Click 📧 on a lead → compose modal opens with AI template pre-filled
3. Send email → toast notification, Google Sheets updates
4. Click 📅 on a lead → booking modal, pick time slot
5. Book call → Google Meet link generated, calendar invite sent to lead
6. Show Google Calendar → invite is there with Meet link
7. Show Google Sheets → Scoping Calls tab updated
8. "And this all triggered an n8n workflow that can send a Telegram notification, update your pipeline, and score the next batch of leads automatically."

---

*Built with ❤️ for Vertex AI Marketing · Angelo Franco · vertexaimarketing.cloud*
