"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";

type Status = "idle" | "sending" | "success" | "error";

export function ContactForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sending");
    setError("");
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    try {
      const res = await fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      const body = await res.json();
      if (res.ok && body.ok) { setStatus("success"); form.reset(); }
      else { setStatus("error"); setError(body.error ?? "Something went wrong"); }
    } catch { setStatus("error"); setError("Network error"); }
  }

  if (status === "success") {
    return <p className="rounded-xl bg-teal-500/10 p-6 text-teal-700">Thanks &mdash; we&apos;ll be in touch within one business day.</p>;
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
      <div>
        <label htmlFor="name" className="block text-sm font-medium">Name</label>
        <input id="name" name="name" required className="mt-1 w-full rounded-lg border border-navy-800/20 px-3 py-2" />
      </div>
      <div>
        <label htmlFor="email" className="block text-sm font-medium">Email</label>
        <input id="email" name="email" type="email" required className="mt-1 w-full rounded-lg border border-navy-800/20 px-3 py-2" />
      </div>
      <div>
        <label htmlFor="company" className="block text-sm font-medium">Company</label>
        <input id="company" name="company" className="mt-1 w-full rounded-lg border border-navy-800/20 px-3 py-2" />
      </div>
      <div>
        <label htmlFor="message" className="block text-sm font-medium">Message</label>
        <textarea id="message" name="message" required rows={4} className="mt-1 w-full rounded-lg border border-navy-800/20 px-3 py-2" />
      </div>
      {status === "error" && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" disabled={status === "sending"} className="w-full">{status === "sending" ? "Sending…" : "Send message"}</Button>
    </form>
  );
}
