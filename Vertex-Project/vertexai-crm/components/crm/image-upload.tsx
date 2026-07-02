'use client';

import { useRef, useState } from 'react';
import { Upload, X, Loader2, ImageIcon } from 'lucide-react';

export default function ImageUpload({
  value,
  onChange,
  folder = 'uploads',
}: {
  value: string | null | undefined;
  onChange: (url: string) => void;
  folder?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('folder', folder);
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) { setError(json.error || 'Upload failed'); }
      else onChange(json.url);
    } catch {
      setError('Upload failed');
    }
    setUploading(false);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      {value ? (
        <div className="relative w-full rounded-lg overflow-hidden border border-black/[0.08] bg-white group">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="cover" className="w-full max-h-52 object-cover" />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
            <button type="button" onClick={() => inputRef.current?.click()} className="inline-flex items-center gap-1.5 bg-white text-gray-800 text-[12px] font-medium px-3 py-1.5 rounded-lg">
              <Upload className="w-3.5 h-3.5" /> Replace
            </button>
            <button type="button" onClick={() => onChange('')} className="inline-flex items-center gap-1.5 bg-white text-red-600 text-[12px] font-medium px-3 py-1.5 rounded-lg">
              <X className="w-3.5 h-3.5" /> Remove
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="w-full flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-black/[0.12] bg-white/60 py-8 text-gray-500 hover:border-amber-400 hover:text-amber-600 transition-colors disabled:opacity-60"
        >
          {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ImageIcon className="w-6 h-6" />}
          <span className="text-[12.5px] font-medium">{uploading ? 'Uploading…' : 'Click to upload image'}</span>
          <span className="text-[10.5px] text-gray-400">PNG, JPG, WebP · max 10MB</span>
        </button>
      )}

      {error && <p className="text-[11.5px] text-red-600 mt-1.5">{error}</p>}

      {/* Optional: paste a URL instead */}
      <input
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder="…or paste an image URL"
        className="w-full mt-2 rounded-lg border border-black/[0.08] bg-white px-3 py-1.5 text-[12px] text-gray-600 outline-none focus:ring-2 focus:ring-amber-400/40"
      />
    </div>
  );
}
