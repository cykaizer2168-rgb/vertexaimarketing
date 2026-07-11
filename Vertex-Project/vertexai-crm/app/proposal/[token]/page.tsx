import { createAdminSupabase } from '@/lib/supabase-admin';
import AcceptButton from './accept-button';

export const dynamic = 'force-dynamic';

export default async function ProposalPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const sb = createAdminSupabase();
  const { data: lead } = sb
    ? await sb.from('leads').select('*').eq('proposal_token', token).single()
    : { data: null };

  if (!lead) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-2xl mb-2">🔍</p>
          <h1 className="text-lg font-bold text-gray-900">Proposal Not Found</h1>
          <p className="text-sm text-gray-500 mt-1">Invalid o expired na ang link na ito.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <img src="/images/logo.png" alt="Vertex AI Marketing" className="h-12 w-auto object-contain" />
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-yellow-400 to-green-400 px-6 py-5">
            <h1 className="text-lg font-bold text-black">Your Growth Proposal</h1>
            <p className="text-sm text-black/70">Para kay {lead.name}</p>
          </div>

          {/* Body */}
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                <p className="text-xs text-gray-400 mb-1">Package</p>
                <p className="font-semibold text-gray-900">{lead.proposal_package || 'Custom Kit'}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                <p className="text-xs text-gray-400 mb-1">Investment</p>
                <p className="font-semibold text-green-600">{lead.proposal_amount || 'Sa assessment'}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                <p className="text-xs text-gray-400 mb-1">Location</p>
                <p className="font-semibold text-gray-900">{lead.location}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                <p className="text-xs text-gray-400 mb-1">Monthly Bill</p>
                <p className="font-semibold text-gray-900">{lead.monthly_bill}</p>
              </div>
            </div>

            <div className="bg-green-50 border border-green-100 rounded-xl p-4 text-sm text-gray-700 leading-relaxed">
              Kasama sa package: professional landing page, Google Business Profile setup, Messenger +
              ad-lead automation, SEO foundations, at CRM pipeline. Libreng strategy call bago mag-simula.
            </div>

            {/* Accept button */}
            <AcceptButton token={token} alreadyAccepted={!!lead.proposal_accepted} />

            <p className="text-center text-xs text-gray-400">
              May tanong? I-reply lang ang email o i-message kami sa Messenger.
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Vertex AI Marketing · More customers, less guesswork.
        </p>
      </div>
    </div>
  );
}
