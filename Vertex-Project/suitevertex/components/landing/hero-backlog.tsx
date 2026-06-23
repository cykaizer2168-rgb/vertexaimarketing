import { GitBranch, Workflow, Plug, Bot, Search, CheckCircle2 } from "lucide-react";

type Status = "Shipped" | "In QA" | "Review" | "In Progress";

const STATUS_STYLES: Record<Status, string> = {
  Shipped: "bg-emerald-500/15 text-emerald-300 ring-emerald-400/20",
  "In QA": "bg-amber-500/15 text-amber-300 ring-amber-400/20",
  Review: "bg-blue-500/15 text-blue-300 ring-blue-400/20",
  "In Progress": "bg-violet-500/15 text-violet-300 ring-violet-400/20",
};

const TICKETS: { icon: typeof Workflow; title: string; meta: string; status: Status }[] = [
  { icon: Workflow, title: "NetSuite workflow fix", meta: "ERP · approvals", status: "Shipped" },
  { icon: Plug, title: "Celigo → Shopify sync", meta: "Integration", status: "In QA" },
  { icon: GitBranch, title: "HubSpot lead routing", meta: "CRM automation", status: "Review" },
  { icon: Bot, title: "AI chatbot automation", meta: "AI agent", status: "In Progress" },
  { icon: Search, title: "Saved search cleanup", meta: "Reporting", status: "Shipped" },
];

const COUNTS = [
  { label: "Open", value: 6, tone: "text-slate-300" },
  { label: "In Review", value: 3, tone: "text-blue-300" },
  { label: "Shipped", value: 18, tone: "text-emerald-300" },
];

export function HeroBacklog() {
  return (
    <div className="relative w-full max-w-md lg:max-w-lg">
      {/* glow behind card */}
      <div
        aria-hidden
        className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-blue-600/20 to-violet-600/20 blur-2xl"
      />
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-ink-900/80 shadow-2xl shadow-black/60 backdrop-blur">
        {/* window chrome */}
        <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="size-2.5 rounded-full bg-rose-400/70" />
            <span className="size-2.5 rounded-full bg-amber-400/70" />
            <span className="size-2.5 rounded-full bg-emerald-400/70" />
          </div>
          <span className="text-xs font-medium text-slate-400">SuiteVertex · Delivery backlog</span>
          <span className="text-[10px] font-medium text-slate-500">Live</span>
        </div>

        {/* counts */}
        <div className="grid grid-cols-3 gap-px bg-white/[0.06]">
          {COUNTS.map((c) => (
            <div key={c.label} className="bg-ink-900 px-4 py-3">
              <div className={`font-display text-xl font-semibold ${c.tone}`}>{c.value}</div>
              <div className="text-[11px] text-slate-500">{c.label}</div>
            </div>
          ))}
        </div>

        {/* tickets */}
        <ul className="divide-y divide-white/[0.06]">
          {TICKETS.map(({ icon: Icon, title, meta, status }) => (
            <li key={title} className="flex items-center gap-3 px-4 py-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-white/10 bg-white/[0.03] text-slate-300">
                <Icon className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-100">{title}</p>
                <p className="truncate text-[11px] text-slate-500">{meta}</p>
              </div>
              <span
                className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 ring-inset ${STATUS_STYLES[status]}`}
              >
                {status}
              </span>
            </li>
          ))}
        </ul>

        {/* weekly digest footer */}
        <div className="flex items-center gap-2.5 border-t border-white/[0.06] bg-white/[0.02] px-4 py-3">
          <CheckCircle2 className="size-4 text-emerald-400" />
          <p className="text-[11px] text-slate-400">
            <span className="font-medium text-slate-200">Weekly digest</span> · 5 shipped, 3 in review — sent Friday 9:00am
          </p>
        </div>
      </div>
    </div>
  );
}
