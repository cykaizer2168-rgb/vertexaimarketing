"use client";

import { useEffect, useState } from "react";
import { useBookCall } from "@/components/landing/cta-modal";

export function TemplateStickyCta() {
  const [show, setShow] = useState(false);
  const { open } = useBookCall();

  useEffect(() => {
    const handler = () => setShow(window.scrollY > 720);
    handler();
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[#070a14]/95 px-4 py-3 backdrop-blur-md transition-transform duration-300 md:hidden ${
        show ? "translate-y-0" : "translate-y-full"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="leading-tight">
          <p className="text-sm font-semibold text-white">From $2,499/mo</p>
          <p className="text-xs text-white/50">Month-to-month · cancel anytime</p>
        </div>
        <button
          onClick={open}
          className="shrink-0 rounded-full bg-gradient-to-r from-blue-500 to-violet-600 px-5 py-2.5 text-sm font-semibold text-white"
        >
          Book a call
        </button>
      </div>
    </div>
  );
}
