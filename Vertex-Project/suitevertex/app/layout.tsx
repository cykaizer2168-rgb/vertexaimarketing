import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "SuiteVertex — NetSuite Implementation, Managed Services & AI Copilot",
    template: "%s | SuiteVertex",
  },
  description:
    "Your complete NetSuite team — humans + AI. We implement NetSuite, run it month to month, and put an AI copilot inside it that answers 24/7 from your real processes and policies.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify({
            "@context": "https://schema.org", "@type": "Organization",
            name: "SuiteVertex", url: "https://suitevertex.com",
            description: "NetSuite implementation, managed services, and an AI copilot for growing businesses.",
          }) }}
        />
        {children}
      </body>
    </html>
  );
}
