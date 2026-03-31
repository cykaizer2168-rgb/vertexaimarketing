// src/lib/webhook.ts
import { readSettings } from '@/lib/settings'

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

    // fetch is intentionally not awaited — fire-and-forget.
    // This function is async only because readSettings() is async.
    // Callers `await triggerWebhook(...)` ensure settings are read before the
    // response is sent, but the HTTP POST to n8n completes independently.
    void fetch(settings.webhookUrl, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ type, ...payload, timestamp: new Date().toISOString() }),
    }).catch(err => console.error('[webhook]', err))
  } catch (err) {
    console.error('[webhook]', err)
  }
}
