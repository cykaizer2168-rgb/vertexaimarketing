'use client';

import { useState } from 'react';
import { Share2, Copy, Check, RotateCw, ExternalLink } from 'lucide-react';

const SITE = 'https://buildwithfranco.com';

function hashtags(tags: string[]) {
  const fromTags = tags.map((t) => '#' + t.replace(/[^a-zA-Z0-9]/g, ''));
  const defaults = ['#NetSuite', '#AIAutomation', '#ERP', '#Consulting'];
  return Array.from(new Set([...fromTags, ...defaults])).filter((h) => h.length > 1).slice(0, 5).join(' ');
}

function build(title: string, excerpt: string, tags: string[], slug: string) {
  const url = `${SITE}/blog/${slug || ''}`;
  const primary = tags[0] || 'this';
  return (
    `${title || 'New article'}\n\n` +
    `${excerpt || 'A quick read on what actually matters — from real, hands-on experience.'}\n\n` +
    `I wrote a practical guide on this — read it here 👇\n${url}\n\n` +
    `What's your experience with ${primary}? I'd love to hear it in the comments.\n\n` +
    `${hashtags(tags)}`
  );
}

export default function LinkedInCaption({
  title,
  excerpt,
  tags = [],
  slug,
}: {
  title: string;
  excerpt: string;
  tags?: string[];
  slug: string;
}) {
  const [open, setOpen] = useState(false);
  const [caption, setCaption] = useState(() => build(title, excerpt, tags, slug));
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(caption);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked */
    }
  };

  return (
    <div className="rounded-xl bg-white border border-black/[0.06] p-4">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#0a66c2] hover:opacity-80"
      >
        <Share2 className="w-4 h-4" /> {open ? 'Hide' : 'Generate'} LinkedIn caption
      </button>

      {open && (
        <div className="mt-3 space-y-2">
          <div className="flex items-center gap-2">
            <span className="flex-1 text-[11px] text-gray-500">Edit kung gusto mo, tapos Copy → paste sa LinkedIn post.</span>
            <button type="button" onClick={() => setCaption(build(title, excerpt, tags, slug))} title="Rebuild from current fields" className="inline-flex items-center gap-1 text-[11px] text-gray-500 hover:text-gray-800">
              <RotateCw className="w-3 h-3" /> Rebuild
            </button>
          </div>

          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            rows={11}
            className="w-full rounded-lg border border-black/[0.08] bg-[#f7f7f9] px-3 py-2 text-[12.5px] leading-relaxed text-gray-800 outline-none focus:ring-2 focus:ring-[#0a66c2]/30"
          />

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={copy}
              className="inline-flex items-center gap-1.5 bg-[#0a66c2] text-white text-[12px] font-semibold px-3 py-1.5 rounded-lg hover:opacity-90"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />} {copied ? 'Copied!' : 'Copy caption'}
            </button>
            <a href="https://www.linkedin.com/feed/?shareActive=true" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[11.5px] text-gray-600 hover:text-gray-900">
              Open LinkedIn <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <p className="text-[10.5px] text-gray-400">Tip: para mas mataas ang reach, magdagdag ng personal na kwento sa unahan, at ilagay ang link sa first comment.</p>
        </div>
      )}
    </div>
  );
}
