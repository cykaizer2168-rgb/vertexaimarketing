import { useEffect } from "react";

// Google AdSense display unit. Renders nothing until BOTH the publisher client id
// (VITE_ADSENSE_CLIENT, e.g. "ca-pub-XXXXXXXXXXXXXXXX") and a slot id are set — so the
// site is safe to ship before AdSense approval. Add the client id in Vercel env and
// pass slot ids (created in the AdSense dashboard) once approved.
const CLIENT = import.meta.env.VITE_ADSENSE_CLIENT;

export default function Ad({ slot, format = "auto", className = "" }) {
  useEffect(() => {
    if (!CLIENT || !slot) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      /* adsbygoogle not ready — ignore */
    }
  }, [slot]);

  if (!CLIENT || !slot) return null;

  return (
    <div className={`my-8 text-center ${className}`}>
      <span className="block text-[10px] uppercase tracking-widest text-mist/50 mb-1">Advertisement</span>
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={CLIENT}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
}
