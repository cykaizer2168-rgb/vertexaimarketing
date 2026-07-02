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

export interface Post {
  id: string;
  created_at: string;
  updated_at: string;
  slug: string;
  title: string;
  excerpt: string | null;
  cover_image: string | null;
  body: string | null;        // markdown
  tags: string[];
  author: string | null;
  og_image: string | null;
  published: boolean;
  published_at: string | null;
  sort_order: number;
}

export interface CaseStudySection { heading: string; body: string }
export interface CaseStudyResult { value: string; label: string }

export interface CaseStudy {
  id: string;
  created_at: string;
  updated_at: string;
  slug: string;
  title: string;
  category: string | null;
  role: string | null;
  date: string | null;
  summary: string | null;
  hero_type: 'image' | 'video';
  hero_src: string | null;
  hero_poster: string | null;
  hero_alt: string | null;
  hero_placeholder: boolean;
  og_image: string | null;
  sections: CaseStudySection[];
  results: CaseStudyResult[];
  tech_stack: string[];
  published: boolean;
  sort_order: number;
}

export interface Appointment {
  id: string;
  created_at: string;
  lead_id: string;
  title: string | null;
  type: string;
  scheduled_at: string;
  duration_min: number | null;
  location: string | null;
  notes: string | null;
  status: 'scheduled' | 'done' | 'cancelled' | 'no_show';
  reminded_at: string | null;
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
  // Outreach execution + tracking
  outreach_status?: 'to_contact' | 'contacted' | 'not_interested' | 'follow_up' | null;
  last_channel?: string | null;
  contacted_at?: string | null;
  outreach_notes?: string | null;
}
