import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabase, fireStageWebhook, fireAppointmentWebhook } from '@/lib/supabase-admin';

// Create an appointment for a lead. Fires a Telegram alert (and an n8n payload the
// stage workflow can use to email the lead) and logs an activity.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { leadId, title, type, scheduledAt, durationMin, location, notes } = body as {
    leadId?: string;
    title?: string;
    type?: string;
    scheduledAt?: string;
    durationMin?: number;
    location?: string;
    notes?: string;
  };
  if (!leadId || !scheduledAt) {
    return NextResponse.json({ error: 'leadId and scheduledAt required' }, { status: 400 });
  }

  const sb = createAdminSupabase();
  if (!sb) return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });

  const { data: lead } = await sb
    .from('leads')
    .select('id, name, email, location, stage')
    .eq('id', leadId)
    .single();
  if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 });

  const apptTitle = title?.trim() || 'Site Assessment';
  const { data: appt, error } = await sb
    .from('appointments')
    .insert({
      lead_id: leadId,
      title: apptTitle,
      type: type ?? 'assessment',
      scheduled_at: scheduledAt,
      duration_min: durationMin ?? 60,
      location: location ?? lead.location ?? null,
      notes: notes ?? null,
    })
    .select('*')
    .single();
  if (error || !appt) {
    return NextResponse.json({ error: 'Insert failed', detail: error?.message }, { status: 500 });
  }

  await sb.from('activities').insert({
    lead_id: leadId,
    type: 'appointment',
    description: `📅 ${apptTitle} scheduled`,
    actor: 'Admin',
  });

  const scheduledLabel = new Date(scheduledAt).toLocaleString('en-PH', {
    weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Manila',
  });

  // Payload carries everything n8n needs to email BOTH the owner and the lead.
  const apptPayload = {
    event_type: 'appointment_booked',
    owner_email: process.env.OWNER_EMAIL ?? 'cykaizer2168@gmail.com',
    lead_name: lead.name,
    lead_email: lead.email,
    name: lead.name, // kept for existing Telegram template
    email: lead.email,
    stage: lead.stage,
    stage_label: 'Appointment booked',
    appointment_title: apptTitle,
    appointment_type: appt.type,
    scheduled_at: scheduledAt,
    scheduled_label: scheduledLabel,
    location: appt.location,
    notes: appt.notes,
  };
  await fireStageWebhook(apptPayload); // Telegram (existing stage workflow)
  await fireAppointmentWebhook(apptPayload); // owner + lead emails (new workflow)

  return NextResponse.json({ ok: true, appointment: appt });
}

// Update an appointment's status (done / cancelled / no_show / scheduled).
export async function PATCH(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { id, status } = body as { id?: string; status?: string };
  if (!id || !['scheduled', 'done', 'cancelled', 'no_show'].includes(status ?? '')) {
    return NextResponse.json({ error: 'id and valid status required' }, { status: 400 });
  }
  const sb = createAdminSupabase();
  if (!sb) return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  await sb.from('appointments').update({ status }).eq('id', id);
  return NextResponse.json({ ok: true });
}
