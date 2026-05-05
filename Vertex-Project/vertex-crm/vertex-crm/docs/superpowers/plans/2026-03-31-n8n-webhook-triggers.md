# n8n Webhook Triggers Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fire a single n8n webhook URL on 4 CRM actions (email sent, call booked, status changed, leads refreshed) so n8n can trigger downstream automations without polling.

**Architecture:** A shared `triggerWebhook(type, payload)` utility in `src/lib/webhook.ts` reads `webhookUrl` from `settings.json` at call time and fires a fire-and-forget POST. Four API routes call it after their primary action succeeds. The webhook URL is configurable in the Settings UI.

**Tech Stack:** Next.js 14 App Router, TypeScript, native `fetch` for the webhook POST, `fs/promises` for settings read (already in use)

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `src/lib/webhook.ts` | Shared `triggerWebhook` utility |
| Modify | `src/app/api/settings/route.ts` | Add `webhookUrl` to `AppSettings`; export `readSettings` |
| Modify | `src/components/views/SettingsView.tsx` | Add webhook URL input in App Config section |
| Modify | `src/app/api/send-email/route.ts` | Fire `email_sent` after Gmail send |
| Modify | `src/app/api/calendar/route.ts` | Fire `call_booked` after Calendar insert |
| Modify | `src/app/api/leads/route.ts` | Fire `status_changed` after PATCH; `leads_refreshed` after GET |

---

## Task 1: Create `src/lib/webhook.ts` and export `readSettings`

**Files:**
- Create: `src/lib/webhook.ts`
- Modify: `src/app/api/settings/route.ts`

- [ ] **Step 1: Export `readSettings` from the settings route**

In `src/app/api/settings/route.ts`, change `async function readSettings()` to `export async function readSettings()` (line 19):

```ts
// BEFORE
async function readSettings(): Promise<AppSettings> {

// AFTER
export async function readSettings(): Promise<AppSettings> {
```

- [ ] **Step 2: Create `src/lib/webhook.ts`**

```ts
// src/lib/webhook.ts
import { readSettings } from '@/app/api/settings/route'

export type WebhookEventType =
  | 'email_sent'
  | 'call_booked'
  | 'status_changed'
  | 'leads_refreshed'

export async function triggerWebhook(
  type: WebhookEventType,
  payload: Record<string, unknown>
): Promise<void> {
  try {
    const settings = await readSettings()
    if (!settings.webhookUrl) return

    await fetch(settings.webhookUrl, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ type, ...payload, timestamp: new Date().toISOString() }),
    })
  } catch (err) {
    console.error('[webhook]', err)
  }
}
```

> Note: `readSettings()` is a server-only function (reads the filesystem). `src/lib/webhook.ts` is only ever imported by API routes, so this is safe.

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd /Users/lukash0915/Vertex-Project/vertex-crm/vertex-crm && npx tsc --noEmit 2>&1 | head -40
```

Expected: no errors involving `webhook.ts` or `settings/route.ts`

- [ ] **Step 4: Commit**

```bash
git add src/lib/webhook.ts src/app/api/settings/route.ts
git commit -m "feat: add triggerWebhook utility and export readSettings"
```

---

## Task 2: Add `webhookUrl` to AppSettings and SettingsView UI

**Files:**
- Modify: `src/app/api/settings/route.ts`
- Modify: `src/components/views/SettingsView.tsx`

- [ ] **Step 1: Add `webhookUrl` to `AppSettings` interface and all usages in `settings/route.ts`**

Replace the `AppSettings` interface (lines 10-17):

```ts
export interface AppSettings {
  sheetId:     string
  leadsTab:    string
  scopingTab:  string
  chatLogsTab: string
  calendlyUrl: string
  adminEmail:  string
  webhookUrl:  string
}
```

Replace the default return in `readSettings()` (lines 28-36):

```ts
  return {
    sheetId:     process.env.GOOGLE_SHEET_ID              || '',
    leadsTab:    process.env.GOOGLE_SHEET_LEADS_TAB       || 'Leads',
    scopingTab:  process.env.GOOGLE_SHEET_SCOPING_TAB     || 'Scoping Calls',
    chatLogsTab: process.env.GOOGLE_SHEET_CHAT_LOGS_TAB   || 'Chat Logs',
    calendlyUrl: process.env.NEXT_PUBLIC_CALENDLY_URL     || '',
    adminEmail:  process.env.NEXT_PUBLIC_ADMIN_EMAIL      || '',
    webhookUrl:  process.env.N8N_WEBHOOK_URL              || '',
  }
```

Update the `updated` object in the POST handler (lines 54-61) to include `webhookUrl`:

```ts
    const updated: AppSettings = {
      sheetId:     body.sheetId     ?? current.sheetId,
      leadsTab:    body.leadsTab    ?? current.leadsTab,
      scopingTab:  body.scopingTab  ?? current.scopingTab,
      chatLogsTab: body.chatLogsTab ?? current.chatLogsTab,
      calendlyUrl: body.calendlyUrl ?? current.calendlyUrl,
      adminEmail:  body.adminEmail  ?? current.adminEmail,
      webhookUrl:  body.webhookUrl  ?? current.webhookUrl,
    }
```

- [ ] **Step 2: Add `webhookUrl` to SettingsView**

In `src/components/views/SettingsView.tsx`:

Add `webhookUrl: ''` to the `AppSettings` interface (line 13) and to the `useState` initial value (line 30):

```ts
// Interface — add after adminEmail:
interface AppSettings {
  sheetId:     string
  leadsTab:    string
  scopingTab:  string
  chatLogsTab: string
  calendlyUrl: string
  adminEmail:  string
  webhookUrl:  string
}

// useState initial value — add webhookUrl:
  const [settings, setSettings] = useState<AppSettings>({
    sheetId:     '',
    leadsTab:    'Leads',
    scopingTab:  'Scoping Calls',
    chatLogsTab: 'Chat Logs',
    calendlyUrl: '',
    adminEmail:  '',
    webhookUrl:  '',
  })
```

In the App Config section (after the Calendly URL `<div>`, before the closing `</div>` of `space-y-3`), add:

```tsx
          <div>
            <label className="text-[11px] text-slate-500 uppercase tracking-wider font-medium mb-1 block">n8n Webhook URL</label>
            <input value={settings.webhookUrl} onChange={e => set('webhookUrl', e.target.value)}
              type="text"
              className="w-full bg-[#141425] border border-white/[0.08] rounded-lg px-3 py-2 text-[13px] text-slate-200 font-mono outline-none focus:border-blue-500/50 transition-colors"
              placeholder="https://your-n8n.com/webhook/abc123" />
          </div>
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd /Users/lukash0915/Vertex-Project/vertex-crm/vertex-crm && npx tsc --noEmit 2>&1 | head -40
```

Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add src/app/api/settings/route.ts src/components/views/SettingsView.tsx
git commit -m "feat: add webhookUrl to AppSettings and Settings UI"
```

---

## Task 3: Wire `triggerWebhook` into all 4 API route call sites

**Files:**
- Modify: `src/app/api/send-email/route.ts`
- Modify: `src/app/api/calendar/route.ts`
- Modify: `src/app/api/leads/route.ts`

- [ ] **Step 1: Wire `email_sent` in `send-email/route.ts`**

Add import at top of file (after existing imports):

```ts
import { triggerWebhook } from '@/lib/webhook'
```

After line 65 (`result` is in scope, after `gmail.users.messages.send` call), and before the `// Update Google Sheets CRM` comment, add:

```ts
    // Fire n8n webhook
    await triggerWebhook('email_sent', { leadId: leadId ?? null, to, subject })
```

Full context around the insertion point:

```ts
    const result = await gmail.users.messages.send({
      userId: 'me',
      requestBody: { raw: encodeEmail(rawMime) },
    })

    // Fire n8n webhook
    await triggerWebhook('email_sent', { leadId: leadId ?? null, to, subject })

    // Update Google Sheets CRM
    if (sheetRow) {
      await updateLastContacted(sheetRow)
    }
```

- [ ] **Step 2: Wire `call_booked` in `calendar/route.ts`**

Add import at top of file (after existing imports):

```ts
import { triggerWebhook } from '@/lib/webhook'
```

After line 82 (`event` is defined, after `calendar.events.insert`), before `const meetLink = ...`:

```ts
    const meetLink = event.data.conferenceData?.entryPoints?.find(e => e.entryPointType === 'video')?.uri

    // Fire n8n webhook
    await triggerWebhook('call_booked', {
      leadId:        leadId ?? null,
      leadName:      body.leadName ?? null,
      company:       body.company ?? null,
      startDateTime,
      meetLink:      meetLink ?? null,
    })
```

Full context around the insertion point:

```ts
    const meetLink = event.data.conferenceData?.entryPoints?.find(e => e.entryPointType === 'video')?.uri

    // Fire n8n webhook
    await triggerWebhook('call_booked', {
      leadId:        leadId ?? null,
      leadName:      body.leadName ?? null,
      company:       body.company ?? null,
      startDateTime,
      meetLink:      meetLink ?? null,
    })

    // Save to Google Sheets → Scoping Calls tab
    if (body.leadName) {
```

- [ ] **Step 3: Wire `status_changed` and `leads_refreshed` in `leads/route.ts`**

Add import at top of file (after existing imports):

```ts
import { triggerWebhook } from '@/lib/webhook'
```

In the GET handler, after `const leads = await getLeads()`:

```ts
    const leads = await getLeads()
    if (leads.length > 0) {
      await triggerWebhook('leads_refreshed', { count: leads.length })
    }
    return NextResponse.json({ leads })
```

In the PATCH handler, after `await updateLeadStatus(sheetRow, status)`:

```ts
    await updateLeadStatus(sheetRow, status)
    await triggerWebhook('status_changed', { sheetRow, status })
    return NextResponse.json({ success: true })
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
cd /Users/lukash0915/Vertex-Project/vertex-crm/vertex-crm && npx tsc --noEmit 2>&1 | head -40
```

Expected: no errors

- [ ] **Step 5: Commit**

```bash
git add src/app/api/send-email/route.ts src/app/api/calendar/route.ts src/app/api/leads/route.ts
git commit -m "feat: wire triggerWebhook into all 4 API call sites"
```

---

## Task 4: Build verification

**Files:** No file changes — verification only.

- [ ] **Step 1: Full TypeScript check**

```bash
cd /Users/lukash0915/Vertex-Project/vertex-crm/vertex-crm && npx tsc --noEmit 2>&1
```

Expected: no output (zero errors)

- [ ] **Step 2: Next.js build**

```bash
cd /Users/lukash0915/Vertex-Project/vertex-crm/vertex-crm && npm run build 2>&1 | tail -30
```

Expected: `✓ Compiled successfully` with no errors. Warnings about missing env vars are acceptable.

- [ ] **Step 3: Manual smoke test checklist**

After starting the dev server (`npm run dev`):

1. **Settings UI**: Navigate to Settings → App Config section. Confirm "n8n Webhook URL" input is visible with correct placeholder.
2. **Save round-trip**: Enter a test URL (e.g., `https://httpbin.org/post`), click Save Settings, reload — confirm value persists.
3. **Empty URL is no-op**: Clear the webhook URL, save, trigger any lead refresh (`/leads` page load) — confirm no network errors in server logs.
4. **Webhook fires**: With a valid URL set, trigger each action and confirm server logs show the fetch attempt (or no `[webhook]` error).

- [ ] **Step 4: Confirm `settings.json` contains `webhookUrl` key after save**

```bash
cd /Users/lukash0915/Vertex-Project/vertex-crm/vertex-crm && cat settings.json
```

Expected: JSON object includes `"webhookUrl": "..."` key.
