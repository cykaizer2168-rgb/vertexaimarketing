import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabase, fireStageWebhook } from '@/lib/supabase-admin';

// Daily cron: remind for appointments scheduled in the next 24h that haven't been
// reminded yet. Fires a Telegram alert (and an n8n payload for a lead email).
export async function GET(req: NextRequest) {
  if (process.env.CRON_SECRET) {
    const auth = req.headers.get('authorization');
    if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }
  }

  const sb = createAdminSupabase();
  if (!sb) return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });

  const now = new Date();
  const in24h = new Date(now.getTime() + 24 * 3600 * 1000);

  const { data: appts } = await sb
    .from('appointments')
    .select('id, title, scheduled_at, location, status, reminded_at, leads(name, email)')
    .eq('status', 'scheduled')
    .is('reminded_at', null)
    .gte('scheduled_at', now.toISOString())
    .lte('scheduled_at', in24h.toISOString());

  let reminded = 0;
  for (const a of appts ?? []) {
    const lead = (a as { leads?: { name?: string; email?: string } | null }).leads ?? null;
    const scheduledLabel = new Date(a.scheduled_at).toLocaleString('en-PH', {
      weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
      hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Manila',
    });
    await fireStageWebhook({
      event_type: 'appointment_reminder',
      owner_email: process.env.OWNER_EMAIL ?? 'cykaizer2168@gmail.com',
      lead_name: lead?.name,
      lead_email: lead?.email,
      name: lead?.name,
      email: lead?.email,
      stage_label: 'Reminder: upcoming appointment',
      appointment_title: a.title,
      scheduled_at: a.scheduled_at,
      scheduled_label: scheduledLabel,
      location: a.location,
    });
    await sb.from('appointments').update({ reminded_at: new Date().toISOString() }).eq('id', a.id);
    reminded++;
  }

  return NextResponse.json({ reminded });
}
