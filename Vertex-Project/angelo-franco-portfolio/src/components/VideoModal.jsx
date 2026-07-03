import { useEffect } from "react";
import { X } from "lucide-react";

// Turn a video URL into a playable source. Supports YouTube, Loom, Vimeo embeds
// and direct video files (.mp4/.webm/.mov).
export function toEmbed(url) {
  if (!url) return null;
  let m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]+)/);
  if (m) return { type: "iframe", src: `https://www.youtube.com/embed/${m[1]}?autoplay=1` };
  m = url.match(/loom\.com\/(?:share|embed)\/([\w-]+)/);
  if (m) return { type: "iframe", src: `https://www.loom.com/embed/${m[1]}?autoplay=1` };
  m = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (m) return { type: "iframe", src: `https://player.vimeo.com/video/${m[1]}?autoplay=1` };
  if (/\.(mp4|webm|mov)(\?|$)/i.test(url)) return { type: "video", src: url };
  return { type: "iframe", src: url };
}

export default function VideoModal({ video, title, onClose }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const e = toEmbed(video);
  if (!e) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="relative w-full max-w-4xl" onClick={(ev) => ev.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-white/80 font-medium truncate pr-4">{title}</span>
          <button onClick={onClose} aria-label="Close" className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 shrink-0">
            <X size={20} />
          </button>
        </div>
        <div className="aspect-video w-full overflow-hidden rounded-xl border border-line bg-black">
          {e.type === "video" ? (
            <video src={e.src} controls autoPlay playsInline className="w-full h-full" />
          ) : (
            <iframe
              src={e.src}
              title={title}
              className="w-full h-full"
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
            />
          )}
        </div>
      </div>
    </div>
  );
}
