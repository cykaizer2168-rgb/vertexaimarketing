# n8n Webhook Triggers Design

## Goal

Fire a single n8n webhook URL on every significant CRM action — email sent, call booked, status changed, leads refreshed — so n8n can trigger downstream automations without polling the CRM.

## Architecture

A shared `triggerWebhook(type, payload)` utility in `src/lib/webhook.ts` handles all webhook firing. It reads the URL from `settings.json` at call time, fires a fire-and-forget POST, and swallows failures silently (logs server-side only). Each of the 4 API routes calls it after their primary action succeeds.

## `src/lib/webhook.ts`

```ts
export type WebhookEventType =
  | 'email_sent'
  | 'call_booked'
  | 'status_changed'
  | 'leads_refreshed'

export async function triggerWebhook(
  type: WebhookEventType,
  payload: Record<string, unknown>
): Promise<void> {
  // reads settings.json at call time — no module-level cache
}
```

- Reads `webhookUrl` from `settings.json` (calls `readSettings()` from `src/app/api/settings/route.ts` — re-exported)
- If `webhookUrl` is empty string, returns immediately (no-op)
- POSTs `{ type, ...payload, timestamp: new Date().toISOString() }` as JSON
- try/catch swallows all errors; `console.error('[webhook]', err)` on failure
- Never throws, never blocks the caller

## Event Payloads

Every event body sent to n8n:

| `type` | Additional fields |
|--------|------------------|
| `email_sent` | `leadId`, `to`, `subject` |
| `call_booked` | `leadId`, `leadName`, `company`, `startDateTime`, `meetLink` |
| `status_changed` | `sheetRow`, `status` |
| `leads_refreshed` | `count` |

`timestamp` is added automatically by `triggerWebhook`.

## Settings Changes

`AppSettings` in `src/app/api/settings/route.ts` gains:
```ts
webhookUrl: string
```

`readSettings()` default fallback:
```ts
webhookUrl: process.env.N8N_WEBHOOK_URL || ''
```

`SettingsView` gains one input under "App Config":
- Label: `n8n Webhook URL`
- Placeholder: `https://your-n8n.com/webhook/abc123`
- Type: text (not url — avoids browser validation friction for local n8n URLs)

## API Route Call Sites

### `POST /api/send-email/route.ts`
After `gmail.users.messages.send(...)` succeeds:
```ts
await triggerWebhook('email_sent', { leadId: body.leadId, to: body.to, subject: body.subject })
```

### `POST /api/calendar/route.ts`
After `calendar.events.insert(...)` succeeds:
```ts
await triggerWebhook('call_booked', {
  leadId:        body.leadId,
  leadName:      body.leadName,
  company:       body.company,
  startDateTime: startDateTime,
  meetLink:      meetLink,
})
```

### `PATCH /api/leads/route.ts`
After `updateLeadStatus(...)` succeeds:
```ts
await triggerWebhook('status_changed', { sheetRow, status })
```

### `GET /api/leads/route.ts`
After `getLeads()` returns results:
```ts
if (leads.length > 0) {
  await triggerWebhook('leads_refreshed', { count: leads.length })
}
```

## Error Handling

Failures are fully silent to the end user. The CRM action always succeeds regardless of webhook outcome. Server logs capture `[webhook] <error message>` for debugging. No retry logic — n8n is designed to be called once per event.

## Files Modified / Created

| Action | File |
|--------|------|
| Create | `src/lib/webhook.ts` |
| Modify | `src/app/api/settings/route.ts` — `webhookUrl` in `AppSettings` + default |
| Modify | `src/components/views/SettingsView.tsx` — webhook URL input in App Config section |
| Modify | `src/app/api/send-email/route.ts` — fire after send |
| Modify | `src/app/api/calendar/route.ts` — fire after insert |
| Modify | `src/app/api/leads/route.ts` — fire after GET and PATCH |

## Out of Scope

- Per-action webhook URLs
- Retry logic or delivery guarantees
- Webhook signature / HMAC verification
- Webhook delivery log in the UI
- Multiple webhook endpoints
