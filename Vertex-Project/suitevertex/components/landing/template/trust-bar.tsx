"use client";

import Image from "next/image";
import { ImageIcon } from "lucide-react";
import { Reveal } from "./ui";
import { TRUST } from "@/content/landing";

export function TemplateTrustBar() {
  return (
    <section className="border-b border-gray-100 bg-white py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <p className="mb-6 text-center text-xs font-semibold uppercase tracking-widest text-gray-400">
            {TRUST.label}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-5">
            {TRUST.items.map((item) =>
              item.logo ? (
                <span
                  key={item.name}
                  className="relative block h-9 w-36 overflow-hidden rounded-md bg-[#06060e]"
                >
                  <Image
                    src={item.logo}
                    alt={item.name}
                    fill
                    sizes="144px"
                    className="object-cover object-center"
                  />
                </span>
              ) : (
                <div
                  key={item.name}
                  className="flex items-center gap-2 text-gray-400 grayscale transition hover:text-gray-600 hover:grayscale-0"
                >
                  {/* logo image placeholder */}
                  <span className="grid size-8 place-items-center rounded-md border border-dashed border-gray-300 bg-gray-100">
                    <ImageIcon className="size-4" />
                  </span>
                  <span className="text-sm font-bold tracking-tight text-gray-500">{item.name}</span>
                </div>
              )
            )}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
