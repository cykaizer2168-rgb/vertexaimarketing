import { ImageIcon } from "lucide-react";

export function ImagePlaceholder({ label, className = "", ratio = "aspect-[4/3]" }) {
  return (
    <div
      className={`placeholder-img ${ratio} w-full rounded-2xl flex flex-col items-center justify-center gap-2 text-mist/70 ${className}`}
    >
      <ImageIcon size={28} strokeWidth={1.5} />
      <span className="font-mono text-[11px] tracking-wide uppercase text-center px-4">
        {label}
      </span>
    </div>
  );
}

export function IconBadge({ icon: Icon, logo, label, accent = "cyan" }) {
  const ring = accent === "amber" ? "border-amber/40 text-amber" : "border-cyan/40 text-cyan";
  return (
    <div
      className={`flex flex-col items-center justify-center gap-1 w-[78px] h-[78px] rounded-2xl bg-panel/80 backdrop-blur border ${ring} shadow-[0_0_24px_rgba(61,169,252,0.08)]`}
    >
      {logo ? (
        <img src={logo} alt={label} className="w-6 h-6 object-contain" />
      ) : (
        <Icon size={20} strokeWidth={1.75} />
      )}
      <span className="font-mono text-[9px] leading-tight text-center text-mist px-1">{label}</span>
    </div>
  );
}

export function LinkPlaceholder({ children = "View Case Study" }) {
  return (
    <a
      href="#"
      data-link-placeholder="true"
      className="inline-flex items-center gap-1.5 text-cyan text-sm font-medium hover:gap-2.5 transition-all"
      onClick={(e) => e.preventDefault()}
    >
      {children}
      <span aria-hidden>→</span>
    </a>
  );
}
