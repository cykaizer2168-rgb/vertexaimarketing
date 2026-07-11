// ============================================================================
// Facebook Messenger Send API helper. Server-only — uses the Page access token.
// ============================================================================

// Send a standard text message to a PSID. Best-effort; returns ok/error.
// Only call inside Meta's 24-hour standard-messaging window.
export async function sendMessengerText(
  psid: string,
  text: string,
): Promise<{ ok: boolean; error?: string }> {
  const token = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
  if (!token) return { ok: false, error: 'no-token' };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(
      `https://graph.facebook.com/v21.0/me/messages?access_token=${encodeURIComponent(token)}`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          recipient: { id: psid },
          messaging_type: 'RESPONSE',
          message: { text },
        }),
        signal: controller.signal,
      },
    );
    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      return { ok: false, error: `graph ${res.status}: ${detail.slice(0, 200)}` };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  } finally {
    clearTimeout(timer);
  }
}
