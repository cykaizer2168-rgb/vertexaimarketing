"use client";

import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { X, CalendarClock, Check } from "lucide-react";

type CtaContextValue = { open: () => void };
const CtaContext = createContext<CtaContextValue | null>(null);

export function useBookCall() {
  const ctx = useContext(CtaContext);
  if (!ctx) throw new Error("useBookCall must be used within <CtaProvider>");
  return ctx;
}

export function CtaProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState("");

  const open = useCallback(() => {
    setStatus("idle");
    setError("");
    setIsOpen(true);
  }, []);
  const close = useCallback(() => setIsOpen(false), []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload = {
      name: fd.get("name"),
      email: fd.get("email"),
      mobile: fd.get("mobile"),
      company: fd.get("company"),
      message: fd.get("needs"),
      website: fd.get("website"), // honeypot
    };
    setStatus("sending");
    setError("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await res.json().catch(() => ({}));
      if (res.ok && body.ok) setStatus("sent");
      else {
        setStatus("error");
        setError(body.error || "Something went wrong. Please try again.");
      }
    } catch {
      setStatus("error");
      setError("Network error. Please try again.");
    }
  }

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [isOpen, close]);

  return (
    <CtaContext.Provider value={{ open }}>
      {children}
      {isOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-label="Book a 15-minute call"
        >
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={close} />
          <div className="sv-rise relative w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-[color:var(--color-ink-soft)] shadow-2xl shadow-black/60">
            <div className="pointer-events-none absolute -top-24 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full bg-violet-600/30 blur-3xl" />
            <button
              onClick={close}
              aria-label="Close"
              className="absolute right-4 top-4 grid size-9 place-items-center rounded-full text-slate-400 transition hover:bg-white/5 hover:text-white"
            >
              <X className="size-5" />
            </button>

            {status === "sent" ? (
              <div className="relative px-7 py-12 text-center">
                <div className="mx-auto mb-5 grid size-14 place-items-center rounded-2xl bg-emerald-500/15 text-emerald-400">
                  <Check className="size-7" />
                </div>
                <h3 className="font-display text-xl font-semibold text-white">Request received</h3>
                <p className="mt-2 text-sm text-slate-400">
                  Thanks — we&apos;ll reach out within one business day to schedule your call.
                </p>
                <button
                  onClick={close}
                  className="mt-6 inline-flex h-11 items-center justify-center rounded-xl border border-white/10 px-5 text-sm font-medium text-slate-200 transition hover:bg-white/5"
                >
                  Done
                </button>
              </div>
            ) : (
              <form className="relative px-7 pb-7 pt-9" onSubmit={handleSubmit}>
                <div className="mb-6 flex items-center gap-3">
                  <div className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 text-white">
                    <CalendarClock className="size-5" />
                  </div>
                  <div>
                    <h3 className="font-display text-lg font-semibold leading-tight text-white">
                      Book a 15-minute call
                    </h3>
                    <p className="text-xs text-slate-400">Typical response under 1 business day.</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <Field label="Full name" name="name" placeholder="Jane Rivera" autoFocus required />
                  <Field label="Work email" name="email" type="email" placeholder="jane@company.com" required />
                  <Field label="Phone" name="mobile" type="tel" placeholder="+63 917 000 0000" required />
                  <Field label="Company" name="company" placeholder="Acme Operations" />
                  <div>
                    <label htmlFor="cta-needs" className="mb-1.5 block text-xs font-medium text-slate-300">
                      What do you need help with?
                    </label>
                    <textarea
                      id="cta-needs"
                      name="needs"
                      rows={3}
                      placeholder="NetSuite workflows, a Celigo/Shopify sync, an AI agent…"
                      className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-blue-400/60 focus:bg-white/[0.05]"
                    />
                  </div>
                </div>

                {status === "error" && (
                  <p className="mt-4 text-center text-sm text-rose-400">{error}</p>
                )}
                <button
                  type="submit"
                  disabled={status === "sending"}
                  className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-xl bg-gradient-to-r from-blue-500 to-violet-600 text-sm font-semibold text-white shadow-lg shadow-violet-900/40 transition hover:brightness-110 disabled:opacity-60"
                >
                  {status === "sending" ? "Sending…" : "Request my call"}
                </button>
                <p className="mt-3 text-center text-[11px] text-slate-500">
                  No spam. We&apos;ll only reach out about your request.
                </p>
              </form>
            )}
          </div>
        </div>
      )}
    </CtaContext.Provider>
  );
}

function Field({
  label,
  name,
  type = "text",
  placeholder,
  autoFocus,
  required,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  autoFocus?: boolean;
  required?: boolean;
}) {
  return (
    <div>
      <label htmlFor={`cta-${name}`} className="mb-1.5 block text-xs font-medium text-slate-300">
        {label}
      </label>
      <input
        id={`cta-${name}`}
        name={name}
        type={type}
        placeholder={placeholder}
        autoFocus={autoFocus}
        required={required}
        className="h-11 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3.5 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-blue-400/60 focus:bg-white/[0.05]"
      />
    </div>
  );
}

/** Shared CTA button that opens the booking modal. */
export function BookCallButton({
  children,
  variant = "primary",
  className = "",
}: {
  children: React.ReactNode;
  variant?: "primary" | "outline" | "nav";
  className?: string;
}) {
  const { open } = useBookCall();
  const base =
    "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/70";
  const styles: Record<string, string> = {
    primary:
      "h-12 px-6 text-sm bg-gradient-to-r from-blue-500 to-violet-600 text-white shadow-lg shadow-violet-900/40 hover:brightness-110",
    outline:
      "h-12 px-6 text-sm border border-white/15 text-slate-100 hover:bg-white/5",
    nav: "h-10 px-4 text-sm bg-white text-[color:var(--color-ink)] hover:bg-slate-200",
  };
  return (
    <button onClick={open} className={`${base} ${styles[variant]} ${className}`}>
      {children}
    </button>
  );
}
