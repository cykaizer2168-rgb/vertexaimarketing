import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { ContactForm } from "@/components/contact-form";
import { SITE } from "@/content/site";

export const metadata: Metadata = { title: "Contact", description: "Book a 15-minute intro call with SuiteVertex." };

export default function ContactPage() {
  return (
    <main>
      <Container className="grid gap-12 py-20 md:grid-cols-2">
        <div>
          <SectionHeading align="left" eyebrow="Contact" title="Book a 15-minute intro call" subtitle="Tell us about your NetSuite setup. We respond within one business day." />
          <p className="mt-6 text-navy-800/70">Prefer email? <a href={`mailto:${SITE.email}`} className="text-indigo-600 underline">{SITE.email}</a></p>
        </div>
        <ContactForm />
      </Container>
    </main>
  );
}
