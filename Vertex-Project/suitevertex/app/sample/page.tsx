import Image from "next/image";

// Apple system-font stack — renders real SF Pro / SF Mono on Apple devices,
// with clean fallbacks elsewhere. (SF Pro can't be legally bundled.)
const APPLE_SANS =
  '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Helvetica, Arial, sans-serif';
const APPLE_MONO =
  'ui-monospace, "SF Mono", SFMono-Regular, Menlo, Monaco, "Cascadia Code", monospace';

const MONO: React.CSSProperties = { fontFamily: APPLE_MONO };

const ACCENT = "#2563eb"; // single flat accent — no gradients anywhere

const SPECS = ["24/7", "Inside NetSuite", "Senior-reviewed", "Month-to-month"];
const STACK = ["NetSuite", "Shopify", "HubSpot", "Salesforce", "Celigo", "Slack"];

const OFFERINGS = [
  {
    idx: "01",
    tag: "Build",
    title: "NetSuite Implementation",
    items: ["Go-lives & module rollouts", "Data migration", "Customizations & scripting", "Process design & training"],
  },
  {
    idx: "02",
    tag: "Run",
    title: "NetSuite Managed Services",
    items: ["Backlog-driven admin", "Saved searches & reports", "Workflows, forms, roles", "Integrations & fixes"],
  },
  {
    idx: "03",
    tag: "Smarter",
    title: "NetSuite Copilot",
    items: ["24/7 AI support, in NetSuite", "Grounded in your SOPs & policies", "Troubleshoots real issues", "Role-based & secure"],
  },
];

export default function SamplePage() {
  return (
    <div className="antialiased" style={{ fontFamily: APPLE_SANS }}>
      {/* sample banner */}
      <div className="bg-black px-4 py-2 text-center text-[11px] uppercase tracking-[0.2em] text-white/70" style={MONO}>
        Sample — Technical Editorial · Apple font (preview only)
      </div>

      {/* ===== HERO ===== */}
      <section className="relative flex min-h-[88vh] flex-col justify-end overflow-hidden bg-[#0a0b0d]">
        <video
          className="absolute inset-0 h-full w-full object-cover opacity-60"
          src="/hero-bg.mp4"
          autoPlay
          loop
          muted
          playsInline
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-[linear-gradient(to_top,#0a0b0d_8%,rgba(10,11,13,0.55)_55%,rgba(10,11,13,0.7)_100%)]" />

        {/* top hairline bar */}
        <div className="absolute inset-x-0 top-0 z-10 border-b border-white/10">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
            <Image
              src="/logos/suitevertex-logo-trans.png"
              alt="SuiteVertex"
              width={150}
              height={31}
              priority
              className="h-7 w-auto"
            />
            <span className="hidden text-[11px] uppercase tracking-[0.2em] text-white/50 sm:block" style={MONO}>
              NetSuite Partner
            </span>
            <a
              href="#"
              className="border border-white/20 px-4 py-2 text-xs font-medium text-white transition hover:bg-white/10"
              style={MONO}
            >
              Book a call
            </a>
          </div>
        </div>

        {/* content — left aligned, editorial */}
        <div className="relative z-10 mx-auto w-full max-w-6xl px-6 pb-14">
          <p className="mb-6 text-[11px] uppercase tracking-[0.25em] text-white/55" style={MONO}>
            Implementation / Managed Services / AI Copilot
          </p>
          <h1
            className="max-w-4xl text-5xl font-semibold leading-[0.98] tracking-[-0.02em] text-white sm:text-6xl md:text-7xl"
          >
            Your complete NetSuite team.
            <br />
            <span style={{ color: ACCENT }}>Humans + AI.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/65">
            We implement NetSuite, run it month to month, and put an AI copilot inside it that answers 24/7 from your
            real processes and policies — not generic SuiteAnswers.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-3">
            <a
              href="#"
              className="px-6 py-3.5 text-sm font-semibold text-white transition hover:opacity-90"
              style={{ backgroundColor: ACCENT }}
            >
              Book a 15-min call
            </a>
            <a
              href="#what"
              className="border border-white/25 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              See what we do →
            </a>
          </div>

          {/* spec row — monospace, hairline separators */}
          <div className="mt-12 flex flex-wrap gap-x-6 gap-y-2 border-t border-white/10 pt-5" style={MONO}>
            {SPECS.map((s) => (
              <span key={s} className="text-[11px] uppercase tracking-[0.18em] text-white/55">
                <span style={{ color: ACCENT }}>—</span> {s}
              </span>
            ))}
          </div>
        </div>

        {/* trust strip — mono wordmarks (no glowy logos) */}
        <div className="relative z-10 border-t border-white/10">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-8 gap-y-2 px-6 py-4" style={MONO}>
            <span className="text-[11px] uppercase tracking-[0.2em] text-white/35">Works with</span>
            {STACK.map((s) => (
              <span key={s} className="text-[11px] uppercase tracking-[0.15em] text-white/60">
                {s}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ===== SERVICES (paper / spec-sheet) ===== */}
      <section id="what" className="bg-[#f7f6f3] py-24 text-[#0a0b0d]">
        <div className="mx-auto max-w-6xl px-6">
          {/* left-aligned editorial header */}
          <div className="flex flex-col gap-6 border-b border-black/10 pb-10 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="mb-4 text-[11px] uppercase tracking-[0.25em] text-black/45" style={MONO}>
                02 — What we do
              </p>
              <h2 className="max-w-2xl text-4xl font-semibold leading-[1.02] tracking-[-0.02em] sm:text-5xl">
                We build it. We run it. We make it smarter.
              </h2>
            </div>
            <p className="max-w-xs text-sm leading-relaxed text-black/55">
              One partner across the full NetSuite lifecycle — from go-live, to day-to-day, to an AI copilot inside your
              account.
            </p>
          </div>

          {/* spec-sheet 3-col with hairline dividers, no gradient boxes */}
          <div className="grid grid-cols-1 md:grid-cols-3 md:divide-x md:divide-black/10">
            {OFFERINGS.map((o) => (
              <div key={o.idx} className="px-0 py-8 md:px-8 md:first:pl-0 md:last:pr-0">
                <div className="flex items-baseline justify-between" style={MONO}>
                  <span className="text-[11px] uppercase tracking-[0.2em] text-black/40">{o.idx}</span>
                  <span className="text-[11px] uppercase tracking-[0.2em]" style={{ color: ACCENT }}>
                    {o.tag}
                  </span>
                </div>
                <h3 className="mt-4 text-xl font-semibold tracking-tight">{o.title}</h3>
                <ul className="mt-5 divide-y divide-black/10 border-y border-black/10">
                  {o.items.map((it) => (
                    <li key={it} className="py-2.5 text-sm text-black/70">
                      {it}
                    </li>
                  ))}
                </ul>
                <a
                  href="#"
                  className="mt-5 inline-block text-xs font-semibold uppercase tracking-[0.15em] transition hover:opacity-70"
                  style={{ ...MONO, color: ACCENT }}
                >
                  Learn more →
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
