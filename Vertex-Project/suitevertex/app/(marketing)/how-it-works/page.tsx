import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { Cta } from "@/components/sections/cta";

export const metadata: Metadata = { title: "How it works", description: "How SuiteVertex's monthly NetSuite plans work — onboarding, requests, and response times." };

const STEPS = [
  { n: "01", title: "Book an intro call", body: "A 15-minute call to understand your NetSuite setup and what you need handled." },
  { n: "02", title: "Pick a plan, onboard in days", body: "We map your account, integrations, and priorities. No six-month ramp." },
  { n: "03", title: "Submit requests, any channel", body: "Email or shared channel. Scripts, workflows, integrations, fixes — one queue." },
  { n: "04", title: "Senior eyes, < 1 business day", body: "Typical response under one business day. Everything reviewed by senior engineers." },
  { n: "05", title: "Predictable monthly invoice", body: "One flat fee. No change orders, no scope-creep theatre. Cancel anytime." },
];

export default function HowItWorksPage() {
  return (
    <main>
      <Container className="py-20">
        <SectionHeading eyebrow="How it works" title="NetSuite work, without the hourly surprises" />
        <div className="mt-12 space-y-8">
          {STEPS.map((s) => (
            <div key={s.n} className="flex gap-6">
              <span className="text-2xl font-bold text-indigo-600">{s.n}</span>
              <div>
                <h3 className="text-lg font-semibold">{s.title}</h3>
                <p className="mt-1 text-navy-800/70">{s.body}</p>
              </div>
            </div>
          ))}
        </div>
      </Container>
      <Cta />
    </main>
  );
}
