import { createClient } from '@supabase/supabase-js';

const url  = process.env.NEXT_PUBLIC_SUPABASE_URL  ?? '';
const key  = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

export const supabase = url && key ? createClient(url, key) : null;

export type LeadStage = 'new' | 'contacted' | 'proposal' | 'negotiating' | 'closed_won' | 'cold';

export interface Lead {
  id: string;
  created_at: string;
  name: string;
  mobile: string;
  email: string;
  location: string;
  monthly_bill: string;
  message: string;
  stage: LeadStage;
  system_type: string;
  est_value: number | null;
  lead_source: string;
  sequence_status: string;
  notes: string;
  // Proposal flow
  proposal_token?: string | null;
  proposal_amount?: string | null;
  proposal_package?: string | null;
  proposal_sent_at?: string | null;
  proposal_accepted?: boolean | null;
  proposal_accepted_at?: string | null;
}

export interface Activity {
  id: string;
  lead_id: string;
  created_at: string;
  type: string;        // stage_change | proposal_sent | proposal_accepted | contact | note
  description: string;
  actor: string;
}

export interface Message {
  id: string;
  lead_id: string;
  created_at: string;
  direction: 'outbound' | 'inbound';
  channel: string;     // email
  kind: string;        // inquiry | welcome | proposal | followup | reply | note
  subject: string | null;
  body: string | null;
  from_addr: string | null;
  to_addr: string | null;
}

export interface Prospect {
  id: string;
  created_at: string;
  name: string;
  phone: string | null;
  website: string | null;
  email: string | null;
  address: string | null;
  area: string | null;
  business_type: string | null;
  product: string | null;
  source: string;
  source_url: string | null;
  external_id: string | null;
  ai_subject: string | null;
  ai_body: string | null;
  status: 'new' | 'approved' | 'dismissed';
  lead_id: string | null;
  // Enrichment (from website analysis)
  facebook?: string | null;
  runs_ads?: boolean | null;
  ad_platforms?: string | null;
  // Best-effort qualification (from scrape, when the source page exposes it)
  rating?: number | null;
  reviews_count?: number | null;
}
