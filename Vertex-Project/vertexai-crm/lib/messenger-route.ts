// ============================================================================
// Shared "score a completed conversation and route the lead" logic.
// Used by both PATCH /api/conversation-state/[psid] and the AI agent endpoint.
// ============================================================================

import { createAdminSupabase, fireStageWebhook, STAGE_LABEL } from './supabase-admin';
import { scoreLead, stageForTier, type QualifyAnswers } from './messenger-score';

type SB = NonNullable<ReturnType<typeof createAdminSupabase>>;

export interface RouteResult {
  score: number;
  tier: 'HOT' | 'WARM' | 'NOT_FIT';
  stage: 'qualified' | 'new' | 'cold';
  routed: boolean;
}

// Score the answers, persist tier on conversation_state, and move the lead into
// the pipeline: HOT→qualified (+handoff webhook), WARM→new, NOT_FIT→cold.
export async function scoreAndRoute(
  sb: SB,
  psid: string,
  answers: QualifyAnswers,
  leadId: string | null,
): Promise<RouteResult> {
  const { score, tier } = scoreLead(answers);
  const newStage = stageForTier(tier);

  await sb
    .from('conversation_state')
    .update({ score, tier, state: 'DONE', updated_at: new Date().toISOString() })
    .eq('psid', psid);

  let routed = false;
  if (leadId) {
    const { data: lead } = await sb.from('leads').select('*').eq('id', leadId).single();
    if (lead && lead.stage !== newStage) {
      await sb.from('leads').update({ stage: newStage }).eq('id', leadId);
      await sb.from('activities').insert({
        lead_id: leadId,
        type: 'stage_change',
        description: `Messenger qualification: ${tier} (score ${score}) → ${STAGE_LABEL[newStage] ?? newStage}`,
        actor: 'Messenger Bot',
      });
      routed = true;

      if (tier === 'HOT') {
        await fireStageWebhook({
          event_type: 'lead_qualified',
          stage: newStage,
          stage_label: STAGE_LABEL[newStage] ?? newStage,
          actor: 'Messenger Bot',
          name: lead.name,
          email: lead.email,
          mobile: lead.mobile,
          location: lead.location,
          monthly_bill: lead.monthly_bill,
        });
      }
    }
  }

  return { score, tier, stage: newStage, routed };
}
