import type { Metadata } from "next";
import { Sora, Manrope } from "next/font/google";
import "./globals.css";

const sora = Sora({ subsets: ["latin"], variable: "--font-sora", display: "swap" });
const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope", display: "swap" });

export const metadata: Metadata = {
  title: {
    default: "SuiteVertex — ERP, AI Automation & Integration, on a Monthly Plan",
    template: "%s | SuiteVertex",
  },
  description:
    "NetSuite support, integrations, workflows, AI agents, CRM automation, and custom internal tools — handled by senior consultants for one predictable monthly fee.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sora.variable} ${manrope.variable}`}>
      <body className="font-sans">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify({
            "@context": "https://schema.org", "@type": "Organization",
            name: "SuiteVertex", url: "https://suitevertex.com",
            description: "ERP, AI automation, and integration services for growing businesses.",
          }) }}
        />
        {children}
      </body>
    </html>
  );
}
