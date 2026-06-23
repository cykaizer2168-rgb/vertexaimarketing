"use client";

import { useState, useEffect } from "react";
import { Menu, X, ImageIcon } from "lucide-react";
import { cn } from "@/lib/cn";
import { useBookCall } from "@/components/landing/cta-modal";
import { NAV_LINKS, BRAND } from "@/content/landing";

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
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        scrolled ? "border-b border-gray-200 bg-white/95 shadow-sm backdrop-blur-xl" : "bg-transparent"
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <a href="#top" className="flex items-center gap-2.5">
          {/* logo image placeholder */}
          <span className="grid size-9 place-items-center rounded-lg border border-dashed border-gray-400 bg-gray-100 text-gray-400">
            <ImageIcon className="size-4" />
          </span>
          <span
            className={cn(
              "text-lg font-bold tracking-tight transition-colors",
              scrolled ? "text-gray-900" : "text-white"
            )}
          >
            {BRAND.name}
          </span>
        </a>

        <nav className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className={cn(
                "text-sm font-medium transition-colors",
                scrolled ? "text-gray-600 hover:text-gray-900" : "text-white/80 hover:text-white"
              )}
            >
              {l.label}
            </a>
          ))}
        </nav>

        <button
          onClick={openModal}
          className="hidden rounded-full bg-gradient-to-r from-blue-500 to-violet-600 px-5 py-2 text-sm font-semibold text-white transition-all hover:scale-105 hover:brightness-110 md:inline-flex"
        >
          Book intro call
        </button>

        <button
          onClick={() => setOpen(!open)}
          className={cn("p-2 md:hidden", scrolled ? "text-gray-700" : "text-white")}
          aria-label="Toggle menu"
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {open && (
        <div className="border-b border-gray-200 bg-white px-4 pb-4 shadow-md md:hidden">
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="block border-b border-gray-100 py-3 text-sm text-gray-600 last:border-0 hover:text-gray-900"
            >
              {l.label}
            </a>
          ))}
          <button
            onClick={() => {
              setOpen(false);
              openModal();
            }}
            className="mt-4 block w-full rounded-full bg-gradient-to-r from-blue-500 to-violet-600 px-5 py-2.5 text-center text-sm font-semibold text-white"
          >
            Book intro call
          </button>
        </div>
      )}
    </header>
  );
}
