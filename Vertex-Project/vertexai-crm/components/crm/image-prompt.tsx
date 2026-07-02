'use client';

import { useState } from 'react';
import { Sparkles, Copy, Check, RotateCw, ExternalLink } from 'lucide-react';

// Builds a ready-to-paste AI image prompt (for ChatGPT / Gemini) that matches the
// site's dark navy + cyan/amber brand aesthetic. The user copies it, generates an
// image, then uploads the result with the ImageUpload control above.
function buildPrompt(title: string, keywords: string, kind: string, aspect: string) {
  return (
    `Create a professional, modern ${aspect} ${kind} image for an article titled "${title || 'Untitled'}".` +
    (keywords ? ` Topic / keywords: ${keywords}.` : '') +
    ` Visual style: sleek, minimal tech/editorial aesthetic — deep navy background (dark #070B16 to #0D1326 gradient) with glowing cyan (#3DA9FC) and warm amber (#F2A93B) accents, subtle circuit / network / data-flow motifs, cinematic lighting, high detail and depth.` +
    ` Absolutely no text, words, letters, logos, or watermarks. Clean, balanced composition with space that reads well as a cover.`
  );
}

export default function ImagePrompt({
  title,
  keywords = [],
  kind = 'blog cover',
  aspect = '16:9',
}: {
  title: string;
  keywords?: string[] | string;
  kind?: string;
  aspect?: string;
}) {
  const kw = Array.isArray(keywords) ? keywords.filter(Boolean).join(', ') : keywords;
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState(() => buildPrompt(title, kw, kind, aspect));
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked — user can select manually */
    }
  };

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1.5 text-[11.5px] font-medium text-amber-600 hover:text-amber-700"
      >
        <Sparkles className="w-3.5 h-3.5" /> {open ? 'Hide' : 'Generate'} AI image prompt (ChatGPT / Gemini)
      </button>

      {open && (
        <div className="mt-2 rounded-lg border border-black/[0.08] bg-white p-3 space-y-2">
          <div className="flex items-center gap-2">
            <span className="flex-1 text-[11px] text-gray-500">
              Copy → paste sa ChatGPT o Gemini → i-generate → i-download → i-upload sa taas.
            </span>
            <button type="button" onClick={() => setPrompt(buildPrompt(title, kw, kind, aspect))} title="Rebuild from current title/tags" className="inline-flex items-center gap-1 text-[11px] text-gray-500 hover:text-gray-800">
              <RotateCw className="w-3 h-3" /> Rebuild
            </button>
          </div>

          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={5}
            className="w-full rounded-lg border border-black/[0.08] bg-[#f7f7f9] px-3 py-2 text-[12px] leading-relaxed text-gray-800 outline-none focus:ring-2 focus:ring-amber-400/40"
          />

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={copy}
              className="inline-flex items-center gap-1.5 bg-amber-500 text-white text-[12px] font-semibold px-3 py-1.5 rounded-lg hover:bg-amber-600"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />} {copied ? 'Copied!' : 'Copy prompt'}
            </button>
            <a href="https://chatgpt.com" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[11.5px] text-gray-600 hover:text-gray-900">
              ChatGPT <ExternalLink className="w-3 h-3" />
            </a>
            <a href="https://gemini.google.com" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[11.5px] text-gray-600 hover:text-gray-900">
              Gemini <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
