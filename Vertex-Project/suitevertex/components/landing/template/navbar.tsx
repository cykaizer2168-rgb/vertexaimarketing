"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { useBookCall } from "@/components/landing/cta-modal";
import { NAV_LINKS } from "@/content/landing";

export function TemplateNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { open: openModal } = useBookCall();

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40);
    handler();
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-colors duration-300",
        scrolled ? "border-b border-white/10 bg-[color:var(--color-ink)]/90 backdrop-blur-md" : "bg-transparent"
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <a href="#top" aria-label="SuiteVertex">
          <Image
            src="/logos/suitevertex-logo-trans.png"
            alt="SuiteVertex"
            width={150}
            height={31}
            priority
            className="h-7 w-auto"
          />
        </a>

        <nav className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((l) => (
            <a key={l.href} href={l.href} className="text-sm text-white/70 transition-colors hover:text-white">
              {l.label}
            </a>
          ))}
        </nav>

        <button
          onClick={openModal}
          className="hidden rounded-md bg-[color:var(--color-accent)] px-5 py-2 text-sm font-semibold text-white transition hover:opacity-90 md:inline-flex"
        >
          Book a call
        </button>

        <button
          onClick={() => setOpen(!open)}
          className="p-2 text-white md:hidden"
          aria-label="Toggle menu"
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {open && (
        <div className="border-b border-white/10 bg-[color:var(--color-ink)] px-6 pb-4 md:hidden">
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="block border-b border-white/10 py-3 text-sm text-white/70 last:border-0 hover:text-white"
            >
              {l.label}
            </a>
          ))}
          <button
            onClick={() => {
              setOpen(false);
              openModal();
            }}
            className="mt-4 block w-full rounded-md bg-[color:var(--color-accent)] px-5 py-2.5 text-center text-sm font-semibold text-white"
          >
            Book a call
          </button>
        </div>
      )}
    </header>
  );
}
