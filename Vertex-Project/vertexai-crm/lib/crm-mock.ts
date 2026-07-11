import type { Lead } from './supabase';

export const MOCK_LEADS: Lead[] = [
  { id:'1', created_at:'2026-06-06T06:00:00Z', name:'Dela Cruz, Maria', mobile:'+63 917 111 2222', email:'maria@gmail.com', location:'Makati City', monthly_bill:'₱8,000–₱10,000', message:'Interested in Essential package', stage:'new', system_type:'On-Grid + Battery', est_value:120000, lead_source:'website', sequence_status:'Email 1 sent ✓', notes:'' },
  { id:'2', created_at:'2026-06-05T14:00:00Z', name:'Reyes, Manuel', mobile:'+63 918 222 3333', email:'manuel@yahoo.com', location:'Quezon City', monthly_bill:'₱5,000–₱8,000', message:'Renting a condo in QC', stage:'new', system_type:'Growth', est_value:60000, lead_source:'messenger', sequence_status:'Queued', notes:'' },
  { id:'3', created_at:'2026-06-04T10:00:00Z', name:'Santos, Jose', mobile:'+63 919 333 4444', email:'jose@gmail.com', location:'Pasig City', monthly_bill:'₱8,000–₱10,000', message:'', stage:'contacted', system_type:'On-Grid + Battery', est_value:120000, lead_source:'website', sequence_status:'Email 3 sent ✓', notes:'' },
  { id:'4', created_at:'2026-06-03T09:00:00Z', name:'Villanueva, Carlo', mobile:'+63 920 444 5555', email:'carlo@gmail.com', location:'Parañaque', monthly_bill:'Above ₱10,000', message:'Want brownout backup', stage:'contacted', system_type:'Premium', est_value:165000, lead_source:'meta_ads', sequence_status:'Email 2 sent ✓', notes:'' },
  { id:'5', created_at:'2026-06-02T08:00:00Z', name:'Garcia, Roberto', mobile:'+63 921 555 6666', email:'roberto@gmail.com', location:'Alabang', monthly_bill:'Above ₱10,000', message:'Big unit, 3BR', stage:'proposal', system_type:'Premium', est_value:180000, lead_source:'referral', sequence_status:'Survey done', notes:'' },
  { id:'6', created_at:'2026-06-01T11:00:00Z', name:'Tan, Christine', mobile:'+63 922 666 7777', email:'christine@gmail.com', location:'BGC, Taguig', monthly_bill:'₱3,000–₱5,000', message:'Studio unit', stage:'negotiating', system_type:'Starter', est_value:55000, lead_source:'website', sequence_status:'Waiting reply', notes:'' },
  { id:'7', created_at:'2026-05-28T09:00:00Z', name:'Lim, Anthony', mobile:'+63 923 777 8888', email:'anthony@gmail.com', location:'Mandaluyong', monthly_bill:'₱5,000–₱8,000', message:'', stage:'closed_won', system_type:'Essential', est_value:110000, lead_source:'referral', sequence_status:'Won ✓', notes:'' },
  { id:'8', created_at:'2026-05-10T09:00:00Z', name:'Cruz, Edna', mobile:'+63 924 888 9999', email:'edna@gmail.com', location:'Cavite City', monthly_bill:'Below ₱2,000', message:'', stage:'cold', system_type:'Starter', est_value:50000, lead_source:'meta_ads', sequence_status:'Win-back seq', notes:'' },
  { id:'9', created_at:'2026-06-01T15:00:00Z', name:'Morales, Patrick', mobile:'+63 925 999 0000', email:'patrick@gmail.com', location:'Las Piñas', monthly_bill:'₱5,000–₱8,000', message:'', stage:'proposal', system_type:'Essential', est_value:110000, lead_source:'website', sequence_status:'Email 4 pending', notes:'' },
];

export const STAGE_LABELS: Record<string, string> = {
  new: 'New',
  qualified: 'Qualified',
  contacted: 'Contacted',
  proposal: 'Proposal Sent',
  negotiating: 'Negotiating',
  closed_won: 'Closed Won',
  cold: 'Cold',
};

export const STAGE_COLORS: Record<string, string> = {
  new:        'bg-blue-50 text-blue-700 border-blue-100',
  qualified:  'bg-rose-50 text-rose-700 border-rose-100',
  contacted:  'bg-sky-50 text-sky-700 border-sky-100',
  proposal:   'bg-orange-50 text-orange-700 border-orange-100',
  negotiating:'bg-yellow-50 text-yellow-700 border-yellow-100',
  closed_won: 'bg-green-50 text-green-700 border-green-100',
  cold:       'bg-gray-100 text-gray-500 border-gray-200',
};

export const STAGE_DOT: Record<string, string> = {
  new:        'bg-blue-400',
  qualified:  'bg-rose-500',
  contacted:  'bg-blue-600',
  proposal:   'bg-orange-400',
  negotiating:'bg-yellow-400',
  closed_won: 'bg-green-500',
  cold:       'bg-gray-400',
};
